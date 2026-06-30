/**
 * Sala Ao Vivo de Degustacao: quiz em grupo com ranking em tempo real.
 * Reaproveita o quiz da Lente (o anfitriao escaneia -> cria a sala). Os participantes
 * entram pelo codigo e respondem o MESMO quiz; o ranking sobe ao vivo (Supabase Realtime).
 */
import { getSupabase } from '../lib/supabase';

async function garantirAuth(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  if ((await sb.auth.getUser()).data.user) return true;
  const { error } = await sb.auth.signInAnonymously();
  return !error;
}

export async function meuUid(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  return (await sb.auth.getUser()).data.user?.id ?? null;
}

export interface FichaVinho {
  nome?: string;
  [k: string]: unknown;
}

export interface PerguntaSala {
  id: number;
  ordem: number;
  pergunta: string;
  opcoes: string[];
  habilidade: string | null;
}

export interface RankItem {
  user_id: string;
  nome: string | null;
  avatar: string | null;
  pontos: number;
  acertos: number;
  respondidas: number;
  posicao: number;
}

/** Retorno de responder_sala no lockstep: NAO traz gabarito (a revelacao vem por estado_jogo). */
export interface RespostaSala {
  registrado: boolean;
  nova: boolean;
}

/** Estado completo do jogo por tick. So traz 'correta'/'explicacao'/'acertou' quando 'revelado'. */
export interface EstadoJogo {
  codigo: string;
  vinho: FichaVinho | null;
  eh_host: boolean;
  iniciada: boolean;
  fim: boolean;
  pergunta_idx: number;
  total: number;
  revelado: boolean;
  responderam: number;
  total_participantes: number;
  ja_respondi: boolean;
  minha_resposta: number | null;
  correta: number | null;
  explicacao: string | null;
  acertou: boolean | null;
}

/** Anfitriao cria a sala a partir do quiz pronto que escaneou. */
export async function criarSala(quizId: string): Promise<{ sala_id: string; codigo: string } | null> {
  const sb = getSupabase();
  if (!sb || !(await garantirAuth())) return null;
  const { data, error } = await sb.rpc('criar_sala', { p_quiz: quizId });
  if (error || !data) {
    console.error('[sala] criar_sala', error?.message);
    return null;
  }
  return data as { sala_id: string; codigo: string };
}

/** Participante entra pelo codigo. */
export async function entrarSala(
  codigo: string,
): Promise<{ sala_id: string; codigo: string; vinho: FichaVinho | null } | null> {
  const sb = getSupabase();
  if (!sb || !(await garantirAuth())) return null;
  const { data, error } = await sb.rpc('entrar_sala', { p_codigo: codigo });
  if (error || !data) return null;
  return data as { sala_id: string; codigo: string; vinho: FichaVinho | null };
}

export async function perguntasDaSala(salaId: string): Promise<PerguntaSala[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('perguntas_da_sala', { p_sala: salaId });
  if (error || !data) return [];
  return (data as PerguntaSala[]).map((r) => ({
    id: r.id,
    ordem: r.ordem,
    pergunta: r.pergunta,
    opcoes: Array.isArray(r.opcoes) ? r.opcoes : [],
    habilidade: r.habilidade ?? null,
  }));
}

export async function responderSala(
  salaId: string,
  perguntaId: number,
  resposta: number,
): Promise<RespostaSala | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('responder_sala', {
    p_sala: salaId,
    p_pergunta: perguntaId,
    p_resposta: resposta,
  });
  if (error || !data) {
    console.error('[sala] responder_sala', error?.message);
    return null;
  }
  return data as RespostaSala;
}

/** Estado do jogo (lobby + lockstep do quiz). Fonte unica de verdade do front. */
export async function estadoJogo(salaId: string): Promise<EstadoJogo | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('estado_jogo', { p_sala: salaId });
  if (error || !data) return null;
  return data as EstadoJogo;
}

/** Anfitriao avanca pra proxima pergunta (todos andam juntos via Realtime). */
export async function avancarPergunta(salaId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc('avancar_pergunta', { p_sala: salaId });
  if (error) console.error('[sala] avancar_pergunta', error.message);
  return !error;
}

/** Anfitriao revela a resposta na marra (destrava se alguem ficou ausente). */
export async function revelarPergunta(salaId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc('revelar_pergunta', { p_sala: salaId });
  if (error) console.error('[sala] revelar_pergunta', error.message);
  return !error;
}

/** Sai da sala: encolhe o quorum e passa o comando adiante se o anfitriao sair. */
export async function sairSala(salaId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.rpc('sair_sala', { p_sala: salaId });
  if (error) console.error('[sala] sair_sala', error.message);
}

export async function rankingSala(salaId: string): Promise<RankItem[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('ranking_sala', { p_sala: salaId });
  if (error || !data) return [];
  return data as RankItem[];
}

export interface EstadoSala {
  codigo: string;
  vinho: FichaVinho | null;
  eh_host: boolean;
  iniciada: boolean;
}

/** Estado atual da sala (lobby vs iniciada). */
export async function estadoSala(salaId: string): Promise<EstadoSala | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('estado_sala', { p_sala: salaId });
  if (error || !data) return null;
  return data as EstadoSala;
}

/** Anfitriao inicia o quiz (todos saem do lobby juntos). */
export async function iniciarSala(salaId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb.rpc('iniciar_sala', { p_sala: salaId });
  if (error) console.error('[sala] iniciar_sala', error.message);
  return !error;
}

/** Assina o estado da sala (detecta o inicio sincronizado). */
export function assinarSala(salaId: string, onMudou: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const canal = sb
    .channel(`sala-estado-${salaId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'salas', filter: `id=eq.${salaId}` },
      () => onMudou(),
    )
    .subscribe();
  return () => {
    void sb.removeChannel(canal);
  };
}

/** Assina o ranking ao vivo: chama onMudou a cada mudanca de pontos na sala. */
export function assinarRanking(salaId: string, onMudou: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const canal = sb
    .channel(`sala-${salaId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sala_participantes', filter: `sala_id=eq.${salaId}` },
      () => onMudou(),
    )
    .subscribe();
  return () => {
    void sb.removeChannel(canal);
  };
}
