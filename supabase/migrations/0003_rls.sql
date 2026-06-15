-- 0003_rls.sql — Row Level Security do Treine seu Paladar
-- Postura:
--   * Dados do jogador: o dono le e escreve apenas as proprias linhas.
--   * Conteudo (licoes, exercicios aprovados, desafio do dia, catalogo de vinhos): leitura ampla.
--   * Economia critica (ledger de cristais) e escrita de conteudo: SEM policy de escrita,
--     logo so o service_role (Edge Functions) consegue gravar. service_role ignora RLS.
--   * A Mesa: leitura/escrita restritas aos membros da mesa.
-- Fase 1 do teste: o client escreve a propria wallet (cristais inclusos) sob policy de dono.
-- O ledger e o resgate de recompensa real ja ficam fechados ao service_role; mover a
-- economia inteira para Edge Functions e a fase 2 (ver docs/F3-ARQUITETURA.md).

-- ------------------------------------------------ catalogo de vinhos (tabelas da 0001)

alter table vinhos enable row level security;
create policy "vinhos_leitura_publica" on vinhos
  for select using (true);

alter table vinhos_quarentena enable row level security;
create policy "quarentena_insert_proprio" on vinhos_quarentena
  for insert with check (auth.uid() = solicitado_por);
create policy "quarentena_select_proprio" on vinhos_quarentena
  for select using (auth.uid() = solicitado_por);

-- ------------------------------------------------ dados do jogador (dono le/escreve)

alter table profiles enable row level security;
create policy "profiles_owner" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

alter table progresso_licao enable row level security;
create policy "progresso_owner" on progresso_licao
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table score_paladar enable row level security;
create policy "score_owner" on score_paladar
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table wallet enable row level security;
create policy "wallet_owner" on wallet
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table eventos_progresso enable row level security;
create policy "eventos_owner" on eventos_progresso
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table desafio_premio enable row level security;
create policy "desafio_premio_owner" on desafio_premio
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Ledger: o dono LE seu extrato; ninguem insere/edita pelo client (so service_role).
alter table transacoes_cristais enable row level security;
create policy "transacoes_owner_select" on transacoes_cristais
  for select using (auth.uid() = user_id);

-- ------------------------------------------------ conteudo (leitura para autenticados)

alter table licoes enable row level security;
create policy "licoes_leitura" on licoes
  for select using (auth.role() = 'authenticated');

alter table exercicios enable row level security;
create policy "exercicios_leitura_aprovados" on exercicios
  for select using (status_auditoria = 'aprovado');

alter table desafio_dia enable row level security;
create policy "desafio_leitura" on desafio_dia
  for select using (auth.role() = 'authenticated');

-- ------------------------------------------------ A Mesa (restrita aos membros)

alter table mesas enable row level security;
create policy "mesas_membro_select" on mesas
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesas.id and m.user_id = auth.uid())
  );

alter table mesa_membros enable row level security;
create policy "mesa_membros_select" on mesa_membros
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesa_membros.mesa_id and m.user_id = auth.uid())
  );

alter table mesa_posts enable row level security;
create policy "mesa_posts_select_membro" on mesa_posts
  for select using (
    exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid())
  );
create policy "mesa_posts_insert_membro" on mesa_posts
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from mesa_membros m where m.mesa_id = mesa_posts.mesa_id and m.user_id = auth.uid())
  );

alter table mesa_tchins enable row level security;
create policy "tchins_select_membro" on mesa_tchins
  for select using (
    exists (
      select 1 from mesa_posts p
      join mesa_membros m on m.mesa_id = p.mesa_id
      where p.id = mesa_tchins.post_id and m.user_id = auth.uid()
    )
  );
create policy "tchins_insert_proprio" on mesa_tchins
  for insert with check (auth.uid() = user_id);
