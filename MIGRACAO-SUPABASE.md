# Runbook — migração do Supabase para a conta de produção

Objetivo: subir o app numa **conta/projeto Supabase novo** (produção), começando limpo
(pré-lançamento). Tempo estimado: **~2 horas**. Sem migração de `auth.users` (local-first +
merge cobrem: quem logar de novo mantém o progresso). Storage de rótulos é **opcional**
(só afeta a miniatura do post "Degustação da Semana" da Mesa).

Legenda: **[VOCÊ]** = login na sua conta (eu guio clique a clique) · **[EU]** = script/execução.

---

## 0. Pré-requisitos (já temos)
- `supabase/migrate.mjs` — aplica TODAS as migrations em ordem (0001→0008). Seguro num
  projeto **vazio** (a ressalva "não rodar npm run migrate" valia só pro projeto antigo,
  onde as tabelas já existiam).
- `supabase/seed.mjs` — importa `data/vinhos_clean.csv` para `vinhos` (staging + cast).
- `data/vinhos_clean.csv` — o catálogo (12.597 linhas; 10.717 com `view_estrita`).
- Os scripts leem `supabase/.env` (fora do git).

---

## 1. [VOCÊ] Criar o projeto novo
1. supabase.com/dashboard → **New project** (na organização de produção).
2. Região: **South America (São Paulo)** `sa-east-1` (mesma de hoje, menor latência BR).
3. Defina e **guarde a senha do banco**.
4. Pegue e me mande (ou guarde):
   - **Project URL**: Settings → API → `Project URL` (`https://<REF>.supabase.co`)
   - **Publishable key**: Settings → API → chave `sb_publishable_...`
   - **service_role key**: Settings → API → `service_role` (secreto — só se formos fazer o storage)
   - **DATABASE_URL**: Settings → Database → **Connection string → Session pooler (porta 5432)**
     `postgresql://postgres.<REF>:<SENHA>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`
     ⚠️ Session pooler (5432), **não** Transaction pooler (6543) — o DDL precisa do 5432.

---

## 2. [EU] `supabase/.env`
```
DATABASE_URL=postgresql://postgres.<REF>:<SENHA>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://<REF>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role>     # só p/ storage (opcional)
```

## 3. [EU] Aplicar o schema
```
cd supabase && npm install && npm run migrate
```
Espera: `ok` em cada uma das migrations + "N tabelas no schema public".

## 4. [EU] Importar os vinhos
```
cd supabase && npm run seed
```
Espera: `total=12597  view_estrita=10717  tipos=N`. (Recarregar do zero: `npm run seed -- --truncate`.)

---

## 5. [VOCÊ] Auth no Supabase (Authentication → URL Configuration)
- **Site URL**: `https://treineopaladar.pages.dev`
- **Redirect URLs**: `https://treineopaladar.pages.dev/**` e `https://*.treineopaladar.pages.dev/**`
- (mesma config que já validamos no projeto antigo)

## 6. [VOCÊ] Google (reusa o MESMO OAuth client; só aponta pro projeto novo)
1. **Google Cloud Console** → APIs e Serviços → Credenciais → seu OAuth Client → **URIs de
   redirecionamento autorizados** → adicionar: `https://<REF>.supabase.co/auth/v1/callback`
2. **Supabase** novo → Authentication → Providers → **Google** → enable + colar o mesmo
   **Client ID** e **Client Secret**.

## 7. [VOCÊ/EU] Apontar o app pro projeto novo
1. **Cloudflare Pages** → projeto → Settings → Environment variables (Production):
   - `VITE_SUPABASE_URL` = `https://<REF>.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = nova `sb_publishable_...`
   - (PostHog continua igual)
2. **[EU]** atualizo o fallback no código (`app/src/lib/supabase.ts`) + `app/.env.local`,
   commito e push (Cloudflare rebuilda).
3. **Redeploy** no Cloudflare (Deployments → Retry, ou já dispara no push).

## 8. [NÓS] Testar end-to-end
- Login com **Google** (PC e celular) → sai de "visitante", não desloga.
- **Sync**: faz uma lição → confere `wallet`/`progresso_licao` no novo banco.
- **Mesa**: abre, posta um "Provei", compartilha um Desafio → aparece no feed.
- **Desafio do dia**: imagem do rótulo carrega (vem do `/rotulos/` local, não do storage).

---

## Opcional (depois) — Storage de rótulos
Só pra a miniatura do post "Degustação da Semana" da Mesa. Precisa de `data/imagens/` (fora
do git; baixar via `data/download_imagens.py` se não estiver na máquina).
```
# criar bucket público 'rotulos' no painel; depois:
cd supabase && npm run upload-rotulos
```

## Rollback
O projeto antigo continua intacto. Se algo falhar, basta **reverter as env vars** do
Cloudflare pro projeto antigo (URL + publishable key) e redeploy — volta ao estado atual
em minutos. Nada é destrutivo no projeto antigo.

---

## O que me destrava às 18h
Só os 4 valores do **passo 1** (Project URL, publishable key, service_role se for storage,
e a DATABASE_URL do Session pooler). Com isso eu rodo schema + vinhos + env, e guio os
cliques de auth/Google/Cloudflare.
