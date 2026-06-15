/**
 * Mapa entre o estado local do engine (EstadoV1) e as tabelas do Supabase.
 *   salvarNaNuvem   : write-through (local -> nuvem), upserts idempotentes.
 *   carregarDaNuvem : hidratacao (nuvem -> EstadoV1).
 * Tudo best-effort: erros nao derrubam o app (o engine local segue valendo).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Coroas,
  EstadoV1,
  Habilidade,
  ProgressoLicao,
  ScorePaladar,
  Wallet,
} from '../engine/types';
import { HABILIDADES } from '../engine/types';
import { dataLocal } from '../engine/tempo';

function iso(ms: number | null): string | null {
  return ms == null ? null : new Date(ms).toISOString();
}

function emMs(s: string | null): number | null {
  return s ? new Date(s).getTime() : null;
}

/** Sobe o EstadoV1 inteiro para a nuvem (upserts idempotentes por chave). */
export async function salvarNaNuvem(sb: SupabaseClient, userId: string, e: EstadoV1): Promise<void> {
  const w = e.wallet;
  const tarefas: PromiseLike<unknown>[] = [];

  tarefas.push(
    sb.from('profiles').upsert(
      {
        id: userId,
        objetivo: e.objetivo,
        nivel_declarado: e.nivelDeclarado,
        onboarding_completo: e.onboardingCompleto,
      },
      { onConflict: 'id' },
    ),
  );

  tarefas.push(
    sb.from('wallet').upsert(
      {
        user_id: userId,
        xp_total: w.xpTotal,
        cristais: w.cristais,
        vidas: w.vidas,
        vidas_ts: iso(w.vidasTs),
        streak: w.streak,
        best_streak: w.bestStreak,
        freezes: w.freezes,
        last_done: w.lastDone,
        meta_diaria: w.metaDiaria,
        xp_hoje: w.xpHoje,
        data_hoje: w.dataHoje,
        licoes_hoje: w.licoesHoje,
        praticas_hoje: w.praticasHoje,
        criado_em: iso(w.criadoEm),
      },
      { onConflict: 'user_id' },
    ),
  );

  const progresso = Object.entries(e.progresso).map(([licaoId, p]) => ({
    user_id: userId,
    licao_id: licaoId,
    coroas: p.coroas,
    vezes_concluida: p.vezesConcluida,
    ultima_conclusao: iso(p.ultimaConclusao),
    proxima_revisao: iso(p.proximaRevisao),
    erros_pendentes: p.errosPendentes,
  }));
  if (progresso.length) {
    tarefas.push(sb.from('progresso_licao').upsert(progresso, { onConflict: 'user_id,licao_id' }));
  }

  const scores = HABILIDADES.map((h) => ({
    user_id: userId,
    dimensao: h,
    valor: Math.round(e.scorePaladar[h] ?? 0),
    atualizado_em: iso(e.scorePaladarTs[h] ?? null),
  }));
  tarefas.push(sb.from('score_paladar').upsert(scores, { onConflict: 'user_id,dimensao' }));

  const eventos = [
    ...e.checkpoints.map((u) => ({ user_id: userId, tipo: 'checkpoint', referencia: u })),
    ...e.microAulas.map((u) => ({ user_id: userId, tipo: 'micro_aula', referencia: u })),
  ];
  if (eventos.length) {
    tarefas.push(
      sb.from('eventos_progresso').upsert(eventos, {
        onConflict: 'user_id,tipo,referencia',
        ignoreDuplicates: true,
      }),
    );
  }

  if (e.ultimoDesafioXp) {
    tarefas.push(
      sb.from('desafio_premio').upsert(
        { user_id: userId, data: e.ultimoDesafioXp },
        { onConflict: 'user_id,data', ignoreDuplicates: true },
      ),
    );
  }

  await Promise.all(tarefas);
}

/** Reconstroi o EstadoV1 a partir das tabelas da nuvem; null se nao ha carteira. */
export async function carregarDaNuvem(sb: SupabaseClient, userId: string): Promise<EstadoV1 | null> {
  const [prof, wal, prog, sc, ev, dp] = await Promise.all([
    sb.from('profiles').select('*').eq('id', userId).maybeSingle(),
    sb.from('wallet').select('*').eq('user_id', userId).maybeSingle(),
    sb.from('progresso_licao').select('*').eq('user_id', userId),
    sb.from('score_paladar').select('*').eq('user_id', userId),
    sb.from('eventos_progresso').select('*').eq('user_id', userId),
    sb
      .from('desafio_premio')
      .select('data')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const w = wal.data;
  if (!w) return null;
  const agora = Date.now();

  const wallet: Wallet = {
    xpTotal: w.xp_total,
    cristais: w.cristais,
    vidas: w.vidas,
    vidasTs: emMs(w.vidas_ts) ?? agora,
    streak: w.streak,
    bestStreak: w.best_streak,
    freezes: w.freezes,
    lastDone: w.last_done,
    metaDiaria: w.meta_diaria,
    xpHoje: w.xp_hoje,
    dataHoje: w.data_hoje ?? dataLocal(agora),
    licoesHoje: w.licoes_hoje,
    praticasHoje: w.praticas_hoje,
    criadoEm: emMs(w.criado_em) ?? agora,
  };

  const progresso: Record<string, ProgressoLicao> = {};
  for (const p of prog.data ?? []) {
    progresso[p.licao_id] = {
      coroas: p.coroas as Coroas,
      vezesConcluida: p.vezes_concluida,
      ultimaConclusao: emMs(p.ultima_conclusao),
      proximaRevisao: emMs(p.proxima_revisao),
      errosPendentes: Array.isArray(p.erros_pendentes) ? (p.erros_pendentes as number[]) : [],
    };
  }

  const scorePaladar = {} as ScorePaladar;
  const scorePaladarTs = {} as Record<Habilidade, number>;
  for (const h of HABILIDADES) {
    scorePaladar[h] = 0;
    scorePaladarTs[h] = agora;
  }
  for (const s of sc.data ?? []) {
    const h = s.dimensao as Habilidade;
    if (HABILIDADES.includes(h)) {
      scorePaladar[h] = s.valor;
      scorePaladarTs[h] = emMs(s.atualizado_em) ?? agora;
    }
  }

  const checkpoints: string[] = [];
  const microAulas: string[] = [];
  for (const x of ev.data ?? []) {
    if (x.tipo === 'checkpoint') checkpoints.push(x.referencia);
    else if (x.tipo === 'micro_aula') microAulas.push(x.referencia);
  }

  return {
    versao: 1,
    wallet,
    progresso,
    scorePaladar,
    scorePaladarTs,
    checkpoints,
    microAulas,
    ultimoDesafioXp: dp.data?.data ?? null,
    objetivo: prof.data?.objetivo ?? null,
    nivelDeclarado: prof.data?.nivel_declarado ?? null,
    onboardingCompleto: prof.data?.onboarding_completo ?? false,
  };
}
