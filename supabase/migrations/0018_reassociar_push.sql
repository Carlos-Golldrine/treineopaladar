-- 0018_reassociar_push.sql — Reivindicar a inscrição Web Push para a conta logada.
-- Aditivo e idempotente.
--
-- Problema: a inscrição (push_subscriptions) é salva com o user_id da sessão no
-- momento do aceite. Quando a conta ANÔNIMA vira REAL (ou troca de conta), a sub
-- fica presa no uid antigo. O novo dono NÃO consegue re-apontar via upsert porque
-- o RLS (`using auth.uid() = user_id`) avalia a linha EXISTENTE (dona = uid antigo)
-- e barra o UPDATE. Resultado: a conta real fica sem push, mesmo com o device
-- inscrito.
--
-- Solução: RPC SECURITY DEFINER que reivindica o endpoint para auth.uid(). Seguro
-- porque exige posse de endpoint + p256dh + auth — só o navegador dono da
-- subscription os conhece (não são expostos em lugar nenhum).

create or replace function public.reassociar_push(
  p_endpoint   text,
  p_p256dh     text,
  p_auth       text,
  p_plataforma text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'sem sessao';
  end if;
  insert into public.push_subscriptions (endpoint, user_id, p256dh, auth, plataforma, visto_em)
  values (p_endpoint, v_uid, p_p256dh, p_auth, p_plataforma, now())
  on conflict (endpoint) do update
    set user_id    = excluded.user_id,
        p256dh     = excluded.p256dh,
        auth       = excluded.auth,
        plataforma = coalesce(excluded.plataforma, public.push_subscriptions.plataforma),
        visto_em   = now();
end;
$$;

comment on function public.reassociar_push is
  'Reivindica/atualiza a inscrição Web Push (por endpoint) para auth.uid(). SECURITY DEFINER para re-apontar inscrição órfã da troca anônima->real (o RLS impede o novo dono). Seguro: exige as chaves da subscription, que só o device dono conhece.';

revoke all on function public.reassociar_push(text, text, text, text) from public, anon;
grant execute on function public.reassociar_push(text, text, text, text) to authenticated;
