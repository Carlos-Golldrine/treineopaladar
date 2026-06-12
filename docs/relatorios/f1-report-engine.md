ENGINE ENTREGUE — C:\Users\camargo\Downloads\treino-paladar-app\app\src\engine\ (types.ts, tempo.ts, economia.ts, vidas.ts, streak.ts, revisao.ts, sessao.ts, store.ts, hooks.ts, index.ts, __tests__/ com 6 arquivos). Fora da pasta, apenas package.json: script "test": "vitest run" + devDependency vitest ^3.2.4.

## API pública (via src/engine/index.ts)

**economia.ts (seção 6)**
- Constantes: `XP_LICAO=20, XP_LICAO_PERFEITA=25, XP_REVISAO=10, XP_DESAFIO_DIA=30, XP_CHECKPOINT=50, META_DIARIA_PADRAO=50, CRISTAIS_LICAO=5, CRISTAIS_BONUS_PERFEITA=2, CRISTAIS_META_DIARIA=10, CRISTAIS_BOAS_VINDAS=60, PRECOS_LOJA={freeze:60, recargaVidas:50, vidaAvulsa:15, dobroXp:30, desbloqueioUnidade:200, desbloqueioModo:300}, MENSAGEM_PACING`
- `multiplicadorSoftCap(licoesConcluidasHoje: number): number` (0-2→1, 3-4→0.5, 5+→0.25)
- `ehD0(criadoEm: number, agora: number): boolean`
- `xpDeLicaoNova(perfeita: boolean, licoesConcluidasHoje: number, isentoD0: boolean): number`
- `cristaisDeLicao(perfeita: boolean): number`

**vidas.ts (seção 3)**
- `VIDAS_MAX=5, REGEN_MS=4h`
- `regenerarVidas(v: EstadoVidas, agora): EstadoVidas` (lazy por timestamp, âncora preserva resto do tick)
- `perderVida(v, agora)`, `ganharVidas(v, qtd, agora)`, `podeIniciarComVidas(vidas, tipo: 'nova'|'revisao'): boolean`, `proximaVidaEmMs(v, agora): number|null`

**streak.ts**
- `registrarDiaConcluido(e: EstadoStreak, agora): EstadoStreak` (idempotente no dia; 1 dia pulado + freeze consome 1 e segue; 2+ pulados quebra)
- `streakEfetivo(e, agora): number` (leitura, 0 se quebrou) · `streakEmRisco(e, agora): boolean` (sem lição hoje e >= 20h local, `HORA_RISCO=20`)

**revisao.ts (seção 2)**
- `INTERVALOS_REVISAO_DIAS=[1,3,7,21]`
- `proximaRevisaoTs(vezesConcluida: number, agora: number): number` (1ª→D+1, 2ª→D+3, 3ª→D+7, 4ª+→D+21)
- `revisoesVencidas(progresso: Record<string,ProgressoLicao>, agora): string[]` (mais atrasada primeiro)

**sessao.ts**
- `iniciarSessao(licao: Licao, tipo: TipoSessao, agora: number, errosPendentes?: number[]): Sessao`
- `responder(s: Sessao, correto: boolean, licao: Licao): EfeitoResposta` ({sessao, custouVida, reinserido})
- `exercicioAtual(s, licao): Exercicio|null` · `indiceAtual(s): number|null` · `sessaoConcluida(s): boolean` · `MAX_REINSERCOES=2`
- `finalizarSessao(s, agora, {licoesConcluidasHoje, isentoD0}): ResultadoSessao` ({acertos, erros, perfeita, xp, cristais, duracao, errosPendentes})
- Paladar: `PALADAR_MAX=1000, PALADAR_GANHO=0.005, PALADAR_DECAIMENTO_SEMANAL=0.01`, `decairPaladar(score, ultimaAtividadeTs, agora): number`, `aplicarPaladar(score, sessao): number` (delta = (1000-score)*0.005*dificuldade por acerto, composto, assintótico)

**store.ts** — `CHAVE_STORE='tp.v1', VERSAO_ESTADO=1`
- `estadoInicial(agora): EstadoV1` · `migrar(bruto: unknown, agora): EstadoV1`
- `criarStore({storage?, agora?}): TPStore` (injetáveis p/ teste) · `obterStore(): TPStore` (singleton) · `resetarStorePadrao()`
- `TPStore`: `getEstado() / getWallet() / getSessao() / getUltimoResultado() / scorePaladarAtual() / revisoesVencidas() / streakEfetivo() / streakEmRisco() / proximaVidaEmMs() / podeIniciar(tipo) / subscribe(fn) / sincronizar() / iniciarLicao(licao, tipo): Sessao|null / responder(correto): EfeitoResposta|null / finalizarLicao(): ResultadoSessao|null / abandonarSessao() / comprar(item: ItemLoja): boolean / definirObjetivo / definirNivel / definirMetaDiaria / concluirOnboarding`

**hooks.ts** — `useWallet(): {wallet, streakEfetivo, streakEmRisco, proximaVidaEmMs}` · `useProgresso(): {progresso, scorePaladar, revisoesVencidas, objetivo, nivelDeclarado, onboardingCompleto}` · `useSessao(): {sessao, licao, exercicio, concluida, resultado, iniciar, responder, finalizar, abandonar}` (useSyncExternalStore, sem JSX)

**types.ts** — contrato completo de conteúdo (Licao, UnidadeMeta, união Exercicio dos 6 tipos com payloads exatos + calibrar opcional) e de estado (Wallet, ProgressoLicao, ScorePaladar, EstadoV1). `../content/types.ts` não existe; types definidos compatíveis com nota para virar re-export.

## Testes e build
- `npm run test`: 51 testes, 51 verdes, 6 arquivos (economia 7, vidas 7, streak 10, sessao 13, revisao 3, store 11). Cobrem: soft cap nas 3 faixas + isenção D0 (unitário e integração no store), grace do primeiro erro, regen 4h (com âncora e teto), streak com freeze (salva com 1 dia pulado, não salva com 2), perfeita vs não, reinserção de errados (max 2 + errosPendentes), agenda D+1/3/7/21 + vencidas, migração de store vazio/corrompido/versão desconhecida + persistência round-trip.
- `npm run build` (tsc --noEmit + vite build): passou limpo.

## Decisões de interpretação
1. Soft cap só em lição NOVA; revisão tem XP integral sempre e não incrementa licoesHoje (seção 3, camada 3: "revisão sempre livre com XP integral").
2. XP fracionado pelo cap é arredondado com Math.round (25*0.5=13, 25*0.25=6).
3. Cristais de lição (5+2) só em sessão nova; sessão de revisão dá 0 cristais (seção 6 não lista cristais para revisão).
4. Meta diária +10 detectada pelo cruzamento de xpHoje (antes < meta, depois >= meta), sem flag extra; paga 1x por dia por construção.
5. Freeze: consome 1 ao concluir com exatamente 1 dia pulado (diff de 2 dias); 2+ dias pulados quebram mesmo com freeze ("quebra com 1 dia pulado").
6. Streak conta conclusão de nova OU revisão ("dia com >= 1 lição concluída").
7. Escada de revisão indexada por vezesConcluida (nova e revisão avançam a escada); coroas (max 3) só sobem em sessão nova.
8. errosPendentes voltam no INÍCIO da fila da sessão seguinte ("itens errados voltam na sessão seguinte").
9. Correção de formato é da UI (swipe tem N cartas, slider tem tolerância): o engine recebe boolean em responder().
10. Erros no meio da sessão descontam vida mas não interrompem a sessão; o bloqueio por 0 vidas é só para INICIAR lição nova.
11. Estado ganhou campo scorePaladarTs (timestamp por dimensão) para o decaimento lazy de 1%/semana; decaimento usa semanas cheias e materializa na próxima atualização da dimensão.
12. "Dia" é data local do aparelho (não Brasília): vale para D0, soft cap, streak e rollover; cálculo imune a horário de verão.
13. comprar() aplica efeito de freeze/recarga/vidaAvulsa; dobroXp e desbloqueios só debitam (efeito é da camada de produto).
14. Sessão ativa vive em memória (não persiste em tp.v1); recarregar a página descarta a sessão sem penalidade.
