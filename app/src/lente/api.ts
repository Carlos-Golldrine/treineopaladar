/**
 * A Lente (teste): scanner de vinho -> quiz gerado pelo n8n.
 *
 * Fluxo: cria a sessao (RPC criar_sessao_quiz) -> manda a foto pro webhook do
 * n8n -> faz polling em quiz_sessoes ate 'pronto'/'erro' -> le as perguntas
 * SEM o gabarito (perguntas_da_sessao) -> valida cada resposta no servidor
 * (responder_quiz). O estado vem 100% do polling (fire-and-forget no n8n).
 *
 * TESTE: o app fala direto com o webhook. Antes da producao de verdade isso
 * deve virar uma Edge Function (token do n8n server-side + CORS controlado).
 */
import { getSupabase } from '../lib/supabase';

const WEBHOOK_URL =
  (import.meta.env.VITE_PALADAR_URL as string | undefined) ||
  'https://n8n.tchin.com.br/webhook/paladar';
/* Token de teste do header auth do webhook. Trocar por segredo server-side. */
const WEBHOOK_TOKEN =
  (import.meta.env.VITE_PALADAR_TOKEN as string | undefined) || '1234567890987654321';

/** Garante uma sessao (anonima basta) pra ter auth.uid() nas RPCs. */
async function garantirAuth(): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  if ((await sb.auth.getUser()).data.user) return true;
  const { error } = await sb.auth.signInAnonymously();
  return !error;
}

export async function criarSessaoQuiz(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  if (!(await garantirAuth())) return null;
  const { data, error } = await sb.rpc('criar_sessao_quiz', { p_imagem: null });
  if (error) {
    console.error('[lente] criar_sessao_quiz', error.message);
    return null;
  }
  return (data as string) ?? null;
}

export async function enviarFotoParaN8n(quizId: string, file: File): Promise<void> {
  const fd = new FormData();
  fd.append('file', file, file.name || 'rotulo.jpg');
  fd.append('quiz_id', quizId);
  /* Fire-and-forget: nao dependemos da resposta (o estado vem do polling em
     quiz_sessoes). Se a resposta for bloqueada por CORS, a requisicao ja chegou
     no n8n e o processamento segue. */
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { paladar: WEBHOOK_TOKEN },
      body: fd,
    });
  } catch {
    /* ignora de proposito: o polling cobre sucesso e erro */
  }
}

export interface FichaVinho {
  nome?: string;
  vinicola?: string;
  safra?: string;
  [k: string]: unknown;
}

export interface StatusSessao {
  status: 'processando' | 'pronto' | 'erro';
  vinho: FichaVinho | null;
  erro: string | null;
}

export async function lerStatusSessao(quizId: string): Promise<StatusSessao | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from('quiz_sessoes')
    .select('status, vinho, erro')
    .eq('id', quizId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StatusSessao;
}

export interface PerguntaQuiz {
  id: number;
  ordem: number;
  pergunta: string;
  opcoes: string[];
  habilidade: string | null;
}

export async function lerPerguntas(quizId: string): Promise<PerguntaQuiz[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc('perguntas_da_sessao', { p_quiz: quizId });
  if (error || !data) return [];
  return (data as PerguntaQuiz[]).map((r) => ({
    id: r.id,
    ordem: r.ordem,
    pergunta: r.pergunta,
    opcoes: Array.isArray(r.opcoes) ? r.opcoes : [],
    habilidade: r.habilidade ?? null,
  }));
}

export interface RespostaQuiz {
  acertou: boolean;
  correta: number;
  explicacao: string | null;
}

export async function responderQuiz(
  quizId: string,
  perguntaId: number,
  resposta: number,
): Promise<RespostaQuiz | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('responder_quiz', {
    p_quiz: quizId,
    p_pergunta: perguntaId,
    p_resposta: resposta,
  });
  if (error || !data) {
    console.error('[lente] responder_quiz', error?.message);
    return null;
  }
  return data as RespostaQuiz;
}
