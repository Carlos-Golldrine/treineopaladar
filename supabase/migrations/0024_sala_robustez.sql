-- 0024_sala_robustez.sql — robustez do lockstep (achados da revisao adversarial):
--   * fecha o lobby ao iniciar: ninguem entra depois que o quiz comecou (estilo Kahoot) ->
--     o denominador "todos responderam" nao infla no meio do jogo;
--   * sair_sala: remove o participante (encolhe o quorum), e se o ANFITRIAO sair passa o
--     comando pro proximo da fila (a sala nunca morre); se esvaziar, encerra;
--   * re-checa o quorum quando alguem sai (pode liberar a revelacao que estava presa por um
--     ausente).
-- Mantem o invariante: o gabarito so e liberado na revelacao. Aditivo e idempotente.

-- Revela SE todos os presentes ja responderam a pergunta atual (quorum). Difere de
-- _revelar_sala (que revela na marra): aqui so dispara quando o quorum esta batido.
create or replace function public._checar_quorum(p_sala uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_quiz  uuid;
  v_idx   int;
  v_rev   int;
  v_perg  bigint;
  v_resp  int;
  v_total int;
begin
  select quiz_id, pergunta_idx, revelar_idx into v_quiz, v_idx, v_rev
    from public.salas where id = p_sala for update;
  if v_quiz is null or v_rev >= v_idx then return; end if;
  select q.id into v_perg from public.quiz_perguntas q
    where q.quiz_id = v_quiz order by q.ordem offset v_idx limit 1;
  if v_perg is null then return; end if;
  select count(*) into v_resp  from public.sala_respostas
    where sala_id = p_sala and pergunta_id = v_perg;
  select count(*) into v_total from public.sala_participantes where sala_id = p_sala;
  if v_total > 0 and v_resp >= v_total then perform public._revelar_sala(p_sala); end if;
end $$;
revoke all on function public._checar_quorum(uuid) from public, anon, authenticated;

-- responder_sala passa a usar o quorum centralizado (mesma logica de antes, sem duplicar).
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
begin
  if not public.eh_participante(p_sala, v_uid) then raise exception 'voce nao esta na sala'; end if;

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

  perform public._checar_quorum(p_sala);   -- todos responderam? revela (pontua + libera)
  return jsonb_build_object('registrado', true, 'nova', v_n > 0);
end $$;
revoke execute on function public.responder_sala(uuid, bigint, int) from public, anon;
grant execute on function public.responder_sala(uuid, bigint, int) to authenticated;

-- entrar_sala: agora BLOQUEIA entrada depois que a sala comecou (lobby fechado).
create or replace function public.entrar_sala(p_codigo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_sala record;
  v_nome text;
begin
  if v_uid is null then raise exception 'sem sessao'; end if;
  select * into v_sala from public.salas where codigo = upper(trim(p_codigo)) and status = 'aberta' limit 1;
  if v_sala.id is null then raise exception 'sala nao encontrada'; end if;
  -- ja participa? deixa re-entrar (reconexao). Senao, so entra se ainda nao comecou.
  if not public.eh_participante(v_sala.id, v_uid) and v_sala.iniciada_em is not null then
    raise exception 'a sala ja comecou';
  end if;
  select nome into v_nome from public.profiles where id = v_uid;
  insert into public.sala_participantes (sala_id, user_id, nome)
  values (v_sala.id, v_uid, v_nome) on conflict do nothing;
  return jsonb_build_object('sala_id', v_sala.id, 'codigo', v_sala.codigo, 'vinho', v_sala.vinho);
end $$;
revoke execute on function public.entrar_sala(text) from public, anon;
grant execute on function public.entrar_sala(text) to authenticated;

-- Sair da sala: encolhe o quorum e, se o anfitriao sair, passa o comando pro proximo.
create or replace function public.sair_sala(p_sala uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid  uuid := auth.uid();
  v_host uuid;
  v_novo uuid;
begin
  select anfitriao_id into v_host from public.salas where id = p_sala for update;
  if v_host is null then return jsonb_build_object('ok', true); end if;   -- sala ja nao existe

  delete from public.sala_participantes where sala_id = p_sala and user_id = v_uid;

  if v_host = v_uid then
    -- anfitriao saiu: passa pro mais antigo que sobrou; se nao sobrou ninguem, encerra
    select user_id into v_novo from public.sala_participantes
      where sala_id = p_sala order by entrou_em asc limit 1;
    if v_novo is null then
      update public.salas set status = 'encerrada' where id = p_sala;
      return jsonb_build_object('ok', true, 'encerrada', true);
    end if;
    update public.salas set anfitriao_id = v_novo where id = p_sala;
  end if;

  perform public._checar_quorum(p_sala);   -- saiu um pendente? pode liberar a revelacao
  return jsonb_build_object('ok', true);
end $$;
revoke execute on function public.sair_sala(uuid) from public, anon;
grant execute on function public.sair_sala(uuid) to authenticated;
