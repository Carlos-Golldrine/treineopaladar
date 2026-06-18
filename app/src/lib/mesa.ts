/**
 * Camada de dados da Mesa (F3, social). Le da nuvem (mesas/mesa_posts/mesa_tchins),
 * entra na mesa da semana via RPC garantir_mesa_semana, reage com Tchin! e assina
 * realtime. Best-effort: sem nuvem, a tela cai no estado vazio.
 */
import { getSupabase } from './supabase';

export type TipoPost = 'conquista' | 'degustacao_palpite' | 'desafio_resultado' | 'provei';

export interface PostMesa {
  id: string;
  userId: string | null;
  tipo: TipoPost;
  payload: Record<string, unknown>;
  criadoEm: string;
  tchins: number;
  meuTchin: boolean;
  meu: boolean;
  /** Nome/avatar do autor (do perfil, ao vivo). null = ainda sem nome. */
  nomeAutor: string | null;
  avatarAutor: string | null;
}

export interface RankItem {
  userId: string;
  pontos: number;
  posicao: number;
  eu: boolean;
  /** Nome/avatar do membro (do perfil, ao vivo). null = ainda sem nome. */
  nome: string | null;
  avatar: string | null;
}

export interface FeedMesa {
  mesaId: string;
  semana: string;
  membros: number;
  divisao: string;
  privada: boolean;
  codigoConvite: string;
  ranking: RankItem[];
  posts: PostMesa[];
}

/** Entra (ou cria) na mesa da semana corrente. Retorna o id, ou null sem nuvem. */
export async function garantirMesa(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('garantir_mesa_semana');
  if (error) return null;
  return (data as string) ?? null;
}

/** Carrega o feed da mesa: semana, contagem de membros e posts com Tchins. */
export async function carregarFeed(mesaId: string): Promise<FeedMesa | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const uid = (await sb.auth.getUser()).data.user?.id ?? null;

  const [mesaRes, membrosRes, postsRes, tchinsRes, divRes, rankRes] = await Promise.all([
    sb.from('mesas').select('semana_iso, codigo_convite, privada').eq('id', mesaId).maybeSingle(),
    sb.from('mesa_membros').select('user_id', { count: 'exact', head: true }).eq('mesa_id', mesaId),
    sb.from('mesa_posts').select('*').eq('mesa_id', mesaId).order('created_at', { ascending: false }),
    sb.from('mesa_tchins').select('post_id, user_id'),
    uid
      ? sb.from('profiles').select('divisao').eq('id', uid).maybeSingle()
      : Promise.resolve({ data: null as { divisao?: string } | null }),
    sb.rpc('ranking_da_mesa', { p_mesa: mesaId }),
  ]);

  const ranking: RankItem[] = (
    (rankRes.data ?? []) as Array<{
      user_id: string;
      pontos: number;
      posicao: number;
      nome: string | null;
      avatar: string | null;
    }>
  ).map((r) => ({
    userId: r.user_id,
    pontos: r.pontos,
    posicao: r.posicao,
    eu: r.user_id === uid,
    nome: r.nome,
    avatar: r.avatar,
  }));

  /* Diretorio de membros (uid -> nome/avatar) a partir do ranking, que ja lista
     todos os membros: nomeia os autores dos posts AO VIVO (sem copia velha). */
  const diretorio = new Map(ranking.map((r) => [r.userId, { nome: r.nome, avatar: r.avatar }]));

  const tchins = (tchinsRes.data ?? []) as Array<{ post_id: string; user_id: string }>;
  const posts: PostMesa[] = ((postsRes.data ?? []) as Array<Record<string, unknown>>).map((p) => {
    const id = p.id as string;
    const doPost = tchins.filter((t) => t.post_id === id);
    const autorId = (p.user_id as string | null) ?? null;
    const info = autorId ? diretorio.get(autorId) : undefined;
    return {
      id,
      userId: autorId,
      tipo: p.tipo as TipoPost,
      payload: (p.payload as Record<string, unknown>) ?? {},
      criadoEm: p.created_at as string,
      tchins: doPost.length,
      meuTchin: doPost.some((t) => t.user_id === uid),
      meu: autorId === uid,
      nomeAutor: info?.nome ?? null,
      avatarAutor: info?.avatar ?? null,
    };
  });

  return {
    mesaId,
    semana: (mesaRes.data?.semana_iso as string) ?? '',
    membros: membrosRes.count ?? 0,
    divisao: (divRes.data?.divisao as string) ?? 'bronze',
    privada: (mesaRes.data?.privada as boolean) ?? false,
    codigoConvite: (mesaRes.data?.codigo_convite as string) ?? '',
    ranking,
    posts,
  };
}

/** Liga/desliga a privacidade da mesa (so membros). Retorna o novo estado. */
export async function definirPrivacidade(mesaId: string, privada: boolean): Promise<boolean | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('definir_privacidade_mesa', { p_mesa: mesaId, p_privada: privada });
  if (error) return null;
  return (data as boolean) ?? privada;
}

/** Entra numa mesa pelo codigo de convite. Retorna o mesaId, ou null. */
export async function entrarPorConvite(codigo: string): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb.rpc('entrar_por_convite', { p_codigo: codigo });
  if (error) return null;
  return (data as string) ?? null;
}

/** Liga/desliga o Tchin! do usuario num post. */
export async function alternarTchin(postId: string, ligar: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = (await sb.auth.getUser()).data.user?.id;
  if (!uid) return;
  if (ligar) {
    await sb
      .from('mesa_tchins')
      .upsert({ post_id: postId, user_id: uid }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
  } else {
    await sb.from('mesa_tchins').delete().eq('post_id', postId).eq('user_id', uid);
  }
}

/** Publica um "Provei" (chips sensoriais estruturados, sem texto livre obrigatorio). */
export async function postarProvei(mesaId: string, chips: string[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = (await sb.auth.getUser()).data.user?.id;
  if (!uid) return;
  await sb.from('mesa_posts').insert({ mesa_id: mesaId, user_id: uid, tipo: 'provei', payload: { chips } });
}

/** Publica o resultado do Desafio do Dia na mesa (grade sem spoiler, estilo Wordle). */
export async function postarDesafioResultado(mesaId: string, grade: string, acertos: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const uid = (await sb.auth.getUser()).data.user?.id;
  if (!uid) return;
  await sb
    .from('mesa_posts')
    .insert({ mesa_id: mesaId, user_id: uid, tipo: 'desafio_resultado', payload: { grade, acertos } });
}

/** Assina mudancas da mesa (posts e tchins) em realtime. Retorna o cancelador. */
export function assinarMesa(mesaId: string, aoMudar: () => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const canal = sb
    .channel(`mesa-${mesaId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_posts', filter: `mesa_id=eq.${mesaId}` }, aoMudar)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mesa_tchins' }, aoMudar)
    .subscribe();
  return () => {
    void sb.removeChannel(canal);
  };
}
