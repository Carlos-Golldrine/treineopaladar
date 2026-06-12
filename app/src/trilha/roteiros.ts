/**
 * Roteiros das micro-aulas de abertura de unidade (15-25s cada).
 *
 * REGRA DE FATO: toda fala com conteudo enologico deriva DIRETAMENTE de um
 * fato da fichaCanonica das licoes da propria unidade (a fonte esta anotada
 * ao lado). As unicas falas sem fonte sao convites neutros de fechamento,
 * sem nenhuma afirmacao sobre vinho. Maximo de 8 palavras por fala
 * (CenaMascote avisa em DEV se passar).
 */
import type { PassoCena } from '../mascote';

export const ROTEIROS_UNIDADE: Record<string, PassoCena[]> = {
  /* Fundamentos do Paladar: 6 passos x 3s = ~18s */
  u1: [
    { estado: 'ensina', prop: 'taca-cha', fala: 'Tanino seca a boca, como chá preto.' } /* u1-l1 */,
    { estado: 'ensina', prop: 'limao', fala: 'Acidez faz a boca encher de água.' } /* u1-l2 */,
    { estado: 'ensina', prop: 'sol', fala: 'Mais álcool no vinho, mais corpo.' } /* u1-l3 */,
    { estado: 'ensina', prop: 'uva', fala: 'Doçura é açúcar que sobrou da fermentação.' } /* u1-l4 */,
    { estado: 'surpreso', fala: 'São quatro sensações, por canais diferentes.' } /* u1-l5 */,
    { estado: 'celebra', prop: 'garrafa', fala: 'Vamos treinar uma de cada vez.' } /* convite */,
  ],

  /* Uvas tintas que abrem portas */
  u2: [
    { estado: 'ensina', prop: 'uva', fala: 'Cabernet Sauvignon: casca grossa, tanino alto.' } /* u2-l1 */,
    { estado: 'feliz', prop: 'garrafa', fala: 'Malbec argentino: frutado e aveludado.' } /* u2-l2 */,
    { estado: 'ensina', fala: 'Merlot: corpo médio e tanino macio.' } /* u2-l3 */,
    { estado: 'surpreso', fala: 'Carmenère viveu décadas escondida como Merlot.' } /* u2-l3 */,
    { estado: 'ensina', prop: 'frio', fala: 'Pinot Noir prefere o clima frio.' } /* u2-l4 */,
    { estado: 'celebra', prop: 'taca-cha', fala: 'Tannat e churrasco: parceria clássica.' } /* u2-l5 */,
  ],

  /* Brancos, roses e bolhas */
  u3: [
    { estado: 'ensina', prop: 'limao', fala: 'Sauvignon Blanc: seco, leve, acidez alta.' } /* u3-l1 */,
    { estado: 'surpreso', prop: 'garrafa', fala: 'Chardonnay muda de estilo com o barril.' } /* u3-l2 */,
    { estado: 'ensina', prop: 'uva', fala: 'Rosé nasce de uvas tintas.' } /* u3-l3 */,
    { estado: 'ensina', fala: 'A casca tinge o suco em horas.' } /* u3-l3 */,
    { estado: 'feliz', fala: 'Bolhas nascem de uma segunda fermentação.' } /* u3-l4 */,
    { estado: 'celebra', prop: 'sol', fala: 'Moscatel: doce, com cheiro de uva fresca.' } /* u3-l5 */,
  ],

  /* Comprar sem errar */
  u4: [
    { estado: 'ensina', prop: 'garrafa', fala: 'Safra é o ano da colheita.' } /* u4-l1 */,
    { estado: 'ensina', fala: 'Seco no rótulo fala só de açúcar.' } /* u4-l2 */,
    { estado: 'surpreso', fala: 'Às cegas, caros nem sempre ganham.' } /* u4-l3 */,
    { estado: 'lamenta', prop: 'sol', fala: 'Calor e luz forte estragam o vinho.' } /* u4-l4 */,
    { estado: 'ensina', prop: 'frio', fala: 'Vinte minutos de geladeira ajeitam o tinto.' } /* u4-l5 */,
    { estado: 'celebra', fala: 'Gôndola sem medo. Vamos juntos?' } /* convite */,
  ],

  /* Harmonizacao sem formula magica */
  u5: [
    { estado: 'ensina', fala: 'Prato leve pede vinho leve.' } /* u5-l1 */,
    { estado: 'ensina', prop: 'taca-cha', fala: 'Gordura da carne amacia o tanino.' } /* u5-l2 */,
    { estado: 'ensina', prop: 'limao', fala: 'Acidez corta a gordura, como limão.' } /* u5-l3 */,
    { estado: 'ensina', prop: 'uva', fala: 'Sobremesa pede vinho tão doce quanto ela.' } /* u5-l4 */,
    { estado: 'surpreso', fala: 'Sal e doce formam pares famosos.' } /* u5-l4 */,
    { estado: 'celebra', prop: 'garrafa', fala: 'Seu gosto faz parte da conta.' } /* u5-l1 */,
  ],

  /* Brasil e vizinhos */
  u6: [
    { estado: 'feliz', prop: 'garrafa', fala: 'Espumante: o cartão de visita brasileiro.' } /* u6-l1 */,
    { estado: 'ensina', prop: 'frio', fala: 'Noites frescas da Serra guardam acidez.' } /* u6-l1 */,
    { estado: 'ensina', prop: 'sol', fala: 'No sertão, colheita o ano inteiro.' } /* u6-l3 */,
    { estado: 'surpreso', fala: 'Salta tem vinhedos acima de 2.000 metros.' } /* u6-l4 */,
    { estado: 'ensina', prop: 'uva', fala: 'Tannat: a uva emblema do Uruguai.' } /* u6-l5 */,
    { estado: 'celebra', fala: 'Vamos provar o nosso lado do mapa?' } /* convite */,
  ],
};
