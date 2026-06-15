# F3 — Arquitetura (contas, banco, social)

Fonte da verdade da infraestrutura da Fase 3. Decisões de produto continuam em
`DECISOES-PRODUTO-V2.md`; este documento descreve **como** elas viram backend.

## Decisões travadas

| Tema | Decisão |
|---|---|
| Banco / backend | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) |
| Região | `us-west-2` (Oregon) — mantida por decisão; custo de ~100-150ms por chamada para usuários no Brasil |
| Login | Anônimo no soft wall, depois `linkIdentity` com Google e e-mail+senha |
| Fonte da verdade | A nuvem (web app online, sem modo offline). `localStorage` vira cache de hidratação |
| Hospedagem do PWA | Cloudflare Pages |
| Analytics | PostHog |

## Topologia

```
[ PWA Vite+React ]  --(supabase-js)-->  [ Supabase ]
  Cloudflare Pages                        - Postgres   (schema + RLS)
  - engine = cache otimista               - Auth       (anônimo -> Google / e-mail+senha)
  - PostHog (analytics)                   - Storage    (bucket "rotulos", 5.219 fotos)
  - Web Push (VAPID)                       - Realtime   (Mesa + liga)
                                          - Edge Funcs (economia, liga, desafio, push, busca)
```

A chave `anon` vai no client (env do Cloudflare). A `service_role` só nas Edge Functions,
nunca no front. O `DATABASE_URL` (com a senha do banco) só em arquivo local fora do git.

## Autenticação: anônimo, depois claim

1. Ao abrir o app: `supabase.auth.signInAnonymously()`. Já cria `auth.users` e dispara
   o trigger `handle_new_user` (migração 0004), que monta `profiles` + `wallet`
   (60 cristais de boas-vindas) + as 7 linhas de `score_paladar` zeradas.
2. Soft wall da FTUE: a pessoa joga a Lição 1 como anônimo, já persistindo na nuvem.
3. Ao "criar conta": `supabase.auth.linkIdentity({ provider: 'google' })` ou cadastro
   por e-mail+senha. **Mesmo `user_id`** — nada de merge, nada se perde.

Por isso a pergunta de "mesclar progresso local" não se aplica: o usuário já é da nuvem
desde a primeira jogada.

## Schema e o mapa para o estado local

O estado local do engine é o `EstadoV1` (`app/src/engine/types.ts`). As migrações
`0001`–`0004` espelham esse estado na nuvem.

| `EstadoV1` (local) | Tabela / coluna (nuvem) |
|---|---|
| `wallet` (1:1) | `wallet` (xp_total, cristais, vidas, vidas_ts, streak, best_streak, freezes, last_done, meta_diaria, xp_hoje, data_hoje, licoes_hoje, praticas_hoje, criado_em) |
| `progresso[licaoId]` | `progresso_licao` (coroas, vezes_concluida, ultima_conclusao, proxima_revisao, erros_pendentes) |
| `scorePaladar` + `scorePaladarTs` | `score_paladar` (valor, atualizado_em) por dimensão |
| `checkpoints[]` / `microAulas[]` | `eventos_progresso` (tipo `checkpoint`/`micro_aula`, referencia = unidade) |
| `ultimoDesafioXp` | `desafio_premio` (por dia) |
| `objetivo` / `nivelDeclarado` / `onboardingCompleto` | `profiles` |

### Drift corrigido (era o que travava aplicar o schema)

As migrações originais tinham divergido do engine. Corrigido na `0002`:

1. `profiles.objetivo`: enum atualizado para `mercado/restaurante/receber/presente/trabalho/outros`.
2. `score_paladar.dimensao`: `rotulo_compra` -> `rotulo`.
3. `wallet`: + `meta_diaria`, `criado_em` (isenção D0 do soft cap) e os contadores do dia
   (`xp_hoje`, `data_hoje`, `licoes_hoje`, `praticas_hoje`) para o soft cap não zerar em reload.
4. `progresso_licao`: + `vezes_concluida` (intervalo de revisão) e + `erros_pendentes` (reinserção).
5. `eventos_progresso` e `desafio_premio`: tabelas novas para o XP de unidade e do desafio,
   que antes só existiam no estado local.

Decisão de modelagem: `progresso_licao.licao_id` é texto **sem FK** para `licoes`. As 30
lições autorais são versionadas no código (`app/src/content`) e empacotadas no app; a
tabela `licoes` fica para a factory e para uma entrega futura via servidor.

## Sincronização (o coração da F3.1)

- O engine continua sendo a **cópia de trabalho** em memória (rápido, testado).
- **Hidratar ao abrir**: ler as linhas do usuário e reconstruir `EstadoV1`. `localStorage`
  vira só cache para o primeiro paint; a nuvem é a verdade.
- **Write-through**: a cada `commit()` do `TPStore`, fazer upsert das linhas tocadas.
- O ponto de costura é o `TPStore.commit()` (`app/src/engine/store.ts`): hoje só chama
  `persistir()` no `localStorage`; passa a também enfileirar o upsert remoto.

## RLS (migração 0003)

- Dados do jogador (`wallet`, `progresso_licao`, `score_paladar`, `eventos_progresso`,
  `desafio_premio`, `profiles`): policy de dono (`auth.uid() = user_id`), CRUD próprio.
- `transacoes_cristais`: dono só **lê**; INSERT exclusivo do service_role.
- Conteúdo (`licoes`, `exercicios` aprovados, `desafio_dia`, `vinhos`): leitura ampla;
  escrita só service_role (sem policy de escrita = bloqueado para o client).
- A Mesa: leitura/escrita restritas a membros da mesa.

### Integridade da economia (fases)

- **Fase 1 (teste de 3 meses)**: o client escreve a própria `wallet` sob policy de dono.
  Cristais podem, em tese, ser forjados por um usuário avançado; aceitável para o teste.
  O que já fica fechado: o **ledger** (`transacoes_cristais`) e qualquer resgate de
  recompensa real, ambos via Edge Function (service_role).
- **Fase 2**: mover as mutações de economia (ganho de XP/cristais, compra na loja) para
  Edge Functions, deixando a `wallet` como select-only para o dono. Sem reescrever o engine.

## Storage

Bucket `rotulos` (leitura pública). Subir as 5.219 fotos (`data/imagens/`, ~324 MB) e
popular `vinhos.thumbnail_url`. As 119 com falha permanente recebem placeholder.

## Edge Functions e cron

| Função | Gatilho | Papel |
|---|---|---|
| `desafio-do-dia` | cron 00:00 America/Sao_Paulo | escolhe 1 exercício aprovado -> `desafio_dia` |
| `liga-semanal` | cron semanal (semana ISO) | forma as Mesas (~20 por coorte), promoção/rebaixamento |
| `notificacoes` | cron / evento | Web Push (streak em risco às 20h) + e-mail |
| `vinho-nao-encontrado` | sob demanda | busca via Firecrawl/Apify -> `vinhos_quarentena` |
| `economia` (fase 2) | RPC do client | valida ganho/gasto server-side |

## Ordem de implementação

1. **F3.0** — corrigir migrations (feito) · aplicar 0001-0004 · importar CSV · smoke test.
2. **F3.1** — `@supabase/supabase-js` + Auth (anônimo->Google/senha) + hidratação/write-through
   no `TPStore` (inverter a fonte da verdade).
3. **F3.2** — upload das fotos para o Storage + `thumbnail_url` + UI.
4. **F3.3** — Edge Functions (desafio, liga) + Mesa em realtime.
5. **F3.4** — Web Push + e-mail + PostHog.
6. **F3.5** — vinho-não-encontrado (quarentena + Firecrawl/Apify).

Cada passo fecha com `npm run build`, `npm run test` e os dois E2E verdes.

## Em aberto (decidir adiante)

- Lições autorais: ficam empacotadas no app (decisão atual) ou migram para a tabela `licoes`?
- Provedor de e-mail transacional (Resend, Supabase nativo, outro).
- PostHog: SaaS direto ou via proxy no Cloudflare para driblar bloqueadores.
