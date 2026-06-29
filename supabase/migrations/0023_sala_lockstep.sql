-- 0023_sala_lockstep.sql — Sala Ao Vivo em LOCKSTEP (estilo Kahoot, host-paced):
--   * todos ficam na MESMA pergunta (salas.pergunta_idx);
--   * a resposta certa/errada SO aparece depois que TODOS responderem (ou o host revelar);
--   * a pontuacao (+10) so e aplicada na revelacao -> nao vaza acerto pelo placar ao vivo;
--   * o gabarito nunca trafega antes da revelacao (responder_sala nao retorna mais 'correta';
--     estado_jogo so devolve 'correta' quando revelado; leitura direta de sala_respostas fechada).
--   * o anfitriao avanca pra proxima (avancar_pergunta) -> todos andam juntos via Realtime.
-- Aditivo e idempotente.

-- ===================== Estado do lockstep =====================
alter table public.salas
  add column if not exists pergunta_idx int not null default 0,   -- pergunta atual (0-based)
  add column if not exists revelar_idx  int not null default -1;   -- maior pergunta ja revelada

-- Fecha a leitura direta de sala_respostas: 'acertou'/'resposta' nao podem vazar antes da
-- revelacao. Tudo passa a ser servido via RPC (estado_jogo devolve so a propria resposta).
drop policy if exists "sala_resp_own" on public.sala_respostas;

-- ===================== Revelacao (pontua + libera o gabarito) =====================
-- Interna: trava a linha da sala (serializa o processamento), pontua os acertos da pergunta
-- atual UMA vez e marca como revelada. Idempotente via guarda revelar_idx >= pergunta_idx.
create or replace function public._revelar_sala(p_sala uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_quiz uuid;
  v_idx  int;
  v_rev  int;
  v_perg bigint;
begin
  select quiz_id, pergunta_idx, revelar_idx into v_quiz, v_idx, v_rev
    from public.salas where id = p_sala for update;
  if v_quiz is null then return false; end if;
  if v_rev >= v_idx then return false; end if;                 -- ja revelada
  select q.id into v_perg from public.quiz_perguntas q
    where q.quiz_id = v_quiz order by q.ordem offset v_idx limit 1;
  if v_perg is null then return false; end if;                 -- sem pergunta nesse indice

  -- pontua quem acertou a pergunta atual (uma unica vez, na revelacao)
  update public.sala_participantes sp
     set pontos  = sp.pontos + 10,
         acertos = sp.acertos + 1
    from public.sala_respostas sr
   where sr.sala_id = p_sala and sr.pergunta_id = v_perg and sr.acertou
     and sp.sala_id = p_sala and sp.user_id = sr.user_id;

  update public.salas set revelar_idx = v_idx where id = p_sala;
  return true;
end $$;
revoke all on function public._revelar_sala(uuid) from public, anon, authenticated;

-- ===================== Responder (lockstep) =====================
-- Valida no servidor, registra a resposta (sem revelar nada) e incrementa so 'respondidas'.
-- Quando TODOS da sala responderam a pergunta atual, dispara a revelacao. NAO retorna gabarito.
create or replace function public.responder_sala(p_sala uuid, p_pergunta bigint, p_resposta int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid        uuid := auth.uid();
  v_quiz       uuid;
  v_idx        int;
  v_rev        int;
  v_perg_atual bigint;
  v_correta    int;
  v_acertou    boolean;
  v_n          int;
  v_resp       int;
  v_total      int;
begin
  if not public.eh_participante(p_sala, v_uid) then raise exception 'voce nao esta na sala'; end if;

  -- trava a linha da sala: serializa o processamento de respostas (conta certa pra revelacao)
  select quiz_id, pergunta_idx, revelar_idx into v_quiz, v_idx, v_rev
    from public.salas where id = p_sala for update;
  if v_quiz is null then raise exception 'sala inexistente'; end if;
  if v_rev >= v_idx then raise exception 'pergunta ja revelada'; end if;

  select q.id, q.correta into v_perg_atual, v_correta
    from public.quiz_perguntas q
   where q.quiz_id = v_quiz order by q.ordem offset v_idx limit 1;
  if v_perg_atual is null then raise exception 'quiz sem pergunta atual'; end if;
  if p_pergunta <> v_perg_atual then raise exception 'pergunta nao e a atual'; end if;

  v_acertou := (p_resposta = v_correta);

  insert into public.sala_respostas (sala_id, user_id, pergunta_id, resposta_usuario, acertou)
  values (p_sala, v_uid, p_pergunta, p_resposta, v_acertou)
  on conflict (sala_id, user_id, pergunta_id) do nothing;
  get diagnostics v_n = row_count;

  if v_n > 0 then
    update public.sala_participantes set respondidas = respondidas + 1
     where sala_id = p_sala and user_id = v_uid;
  end if;

  -- todos responderam a pergunta atual? entao revela (pontua + libera o gabarito pra todos)
  select count(*) into v_resp  from public.sala_respostas
    where sala_id = p_sala and pergunta_id = v_perg_atual;
  select count(*) into v_total from public.sala_participantes where sala_id = p_sala;
  if v_resp >= v_total then perform public._revelar_sala(p_sala); end if;

  return jsonb_build_object('registrado', true, 'nova', v_n > 0);
end $$;
revoke execute on function public.responder_sala(uuid, bigint, int) from public, anon;
grant execute on function public.responder_sala(uuid, bigint, int) to authenticated;

-- ===================== Estado do jogo (fonte unica do front) =====================
-- Devolve tudo que o cliente precisa por tick, SEM vazar gabarito: 'correta'/'explicacao'/
-- 'acertou' so vem quando 'revelado'. 'minha_resposta' e a propria escolha (pode vir sempre).
create or replace function public.estado_jogo(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := auth.uid();
  v_s        record;
  v_total    int;
  v_perg     bigint;
  v_correta  int;
  v_explic   text;
  v_revelado boolean;
  v_fim      boolean;
  v_resp     int;
  v_part     int;
  v_minha    int;
  v_ja       boolean;
  v_acertou  boolean;
begin
  if not public.eh_participante(p_sala, v_uid) then raise exception 'voce nao esta na sala'; end if;

  select codigo, vinho, anfitriao_id, quiz_id, iniciada_em, pergunta_idx, revelar_idx
    into v_s from public.salas where id = p_sala;

  select count(*) into v_total from public.quiz_perguntas where quiz_id = v_s.quiz_id;
  v_fim      := v_s.pergunta_idx >= v_total;
  v_revelado := (not v_fim) and (v_s.revelar_idx >= v_s.pergunta_idx);

  v_perg := null; v_correta := null; v_explic := null;
  if not v_fim then
    select q.id, q.correta, q.explicacao into v_perg, v_correta, v_explic
      from public.quiz_perguntas q
     where q.quiz_id = v_s.quiz_id order by q.ordem offset v_s.pergunta_idx limit 1;
  end if;

  v_part := (select count(*) from public.sala_participantes where sala_id = p_sala);
  v_resp := 0; v_ja := false; v_minha := null;
  if v_perg is not null then
    select count(*) into v_resp from public.sala_respostas
      where sala_id = p_sala and pergunta_id = v_perg;
    select resposta_usuario into v_minha from public.sala_respostas
      where sala_id = p_sala and user_id = v_uid and pergunta_id = v_perg;
    v_ja := v_minha is not null;
  end if;

  v_acertou := null;
  if v_revelado and v_ja then v_acertou := (v_minha = v_correta); end if;

  return jsonb_build_object(
    'codigo',              v_s.codigo,
    'vinho',               v_s.vinho,
    'eh_host',             v_s.anfitriao_id = v_uid,
    'iniciada',            v_s.iniciada_em is not null,
    'fim',                 v_fim,
    'pergunta_idx',        v_s.pergunta_idx,
    'total',               v_total,
    'revelado',            v_revelado,
    'responderam',         v_resp,
    'total_participantes', v_part,
    'ja_respondi',         v_ja,
    'minha_resposta',      v_minha,
    'correta',             case when v_revelado then v_correta else null end,
    'explicacao',          case when v_revelado then v_explic  else null end,
    'acertou',             v_acertou
  );
end $$;
revoke execute on function public.estado_jogo(uuid) from public, anon;
grant execute on function public.estado_jogo(uuid) to authenticated;

-- ===================== Controle do anfitriao =====================
-- Avanca pra proxima pergunta (so depois de revelada). Todos andam juntos via Realtime (salas).
create or replace function public.avancar_pergunta(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid   uuid := auth.uid();
  v_host  uuid;
  v_idx   int;
  v_rev   int;
  v_quiz  uuid;
  v_total int;
begin
  select anfitriao_id, pergunta_idx, revelar_idx, quiz_id into v_host, v_idx, v_rev, v_quiz
    from public.salas where id = p_sala for update;
  if v_host is null then raise exception 'sala inexistente'; end if;
  if v_host <> v_uid then raise exception 'so o anfitriao avanca'; end if;
  select count(*) into v_total from public.quiz_perguntas where quiz_id = v_quiz;
  if v_idx >= v_total then return jsonb_build_object('fim', true); end if;
  if v_rev < v_idx then raise exception 'revele a resposta antes de avancar'; end if;
  update public.salas set pergunta_idx = v_idx + 1 where id = p_sala;
  return jsonb_build_object('fim', (v_idx + 1) >= v_total, 'pergunta_idx', v_idx + 1);
end $$;
revoke execute on function public.avancar_pergunta(uuid) from public, anon;
grant execute on function public.avancar_pergunta(uuid) to authenticated;

-- Revela a pergunta atual na marra (host) — pra destravar a mesa se alguem ficou ausente.
create or replace function public.revelar_pergunta(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_host uuid;
begin
  select anfitriao_id into v_host from public.salas where id = p_sala;
  if v_host is null then raise exception 'sala inexistente'; end if;
  if v_host <> v_uid then raise exception 'so o anfitriao revela'; end if;
  perform public._revelar_sala(p_sala);
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.revelar_pergunta(uuid) from public, anon;
grant execute on function public.revelar_pergunta(uuid) to authenticated;
