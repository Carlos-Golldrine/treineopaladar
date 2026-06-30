/** Helpers de tempo. "Dia" e sempre a data local do aparelho (YYYY-MM-DD). */

export const MS_HORA = 3_600_000;
export const MS_DIA = 24 * MS_HORA;
export const MS_SEMANA = 7 * MS_DIA;

/** Data local no formato YYYY-MM-DD. */
export function dataLocal(ts: number): string {
  const d = new Date(ts);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** Diferenca em dias de calendario entre duas datas locais (ate - de). Imune a horario de verao. */
export function diffDias(de: string, ate: string): number {
  return Math.round((aoMeioDia(ate) - aoMeioDia(de)) / MS_DIA);
}

function aoMeioDia(data: string): number {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12).getTime();
}

/** Hora local (0-23). */
export function horaLocal(ts: number): number {
  return new Date(ts).getHours();
}

/**
 * Semana ISO no formato "IYYY-Www" (ex.: "2026-W27"), em America/Sao_Paulo —
 * casa com o `to_char(... 'IYYY-"W"IW')` que a Mesa usa no servidor. A semana e
 * a chave do placar semanal: a quinta-feira define o ano/semana ISO.
 */
export function semanaIso(ts: number): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [ano, mes, dia] = fmt.format(ts).split('-').map(Number);
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  const diaSem = (d.getUTCDay() + 6) % 7; // segunda=0 ... domingo=6
  d.setUTCDate(d.getUTCDate() - diaSem + 3); // quinta-feira desta semana ISO
  const anoIso = d.getUTCFullYear();
  const primeira = new Date(Date.UTC(anoIso, 0, 4)); // 4/jan sempre cai na semana 1
  primeira.setUTCDate(primeira.getUTCDate() - ((primeira.getUTCDay() + 6) % 7) + 3);
  const semana = 1 + Math.round((d.getTime() - primeira.getTime()) / (7 * MS_DIA));
  return `${anoIso}-W${String(semana).padStart(2, '0')}`;
}
