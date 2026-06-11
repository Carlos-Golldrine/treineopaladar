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
