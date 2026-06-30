/* Gera o Word (docs/Guia-Treine-seu-Paladar.docx) com o guia + os prints de docs/img. */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const require = createRequire(import.meta.url);
const {
  Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, HeadingLevel,
  LevelFormat, BorderStyle, ExternalHyperlink,
} = require('docx');

const root = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(root, '..', 'docs', 'img');
const OUT = path.resolve(root, '..', 'docs', 'Guia-Treine-seu-Paladar.docx');

const WINE = '722F37';
const GOLD = 'B07D3B';
const GREY = '6B6B6B';

// PNG 824x1784 (412x892 @2x) -> ratio 0.4619
const ratio = 824 / 1784;
function img(file, w = 196) {
  const h = Math.round(w / ratio);
  return new ImageRun({
    type: 'png',
    data: fs.readFileSync(path.join(IMG, file)),
    transformation: { width: w, height: h },
    altText: { title: file, description: file, name: file },
  });
}
/* Uma ou duas imagens centralizadas (lado a lado quando duas). */
function figura(files, w) {
  const kids = [];
  files.forEach((f, i) => {
    if (i > 0) kids.push(new TextRun({ text: '   ' }));
    kids.push(img(f, w ?? (files.length > 1 ? 168 : 200)));
  });
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 200 }, children: kids });
}
function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: t, color: WINE })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: t, color: WINE })] });
}
function p(runs) {
  return new Paragraph({ spacing: { after: 120 }, children: Array.isArray(runs) ? runs : [new TextRun(runs)] });
}
function comoTestar(txt) {
  return new Paragraph({
    spacing: { after: 160 },
    children: [new TextRun({ text: 'Como testar: ', bold: true, color: GOLD }), new TextRun(txt)],
  });
}
function bullet(t) {
  return new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] });
}
function passo(t) {
  return new Paragraph({ numbering: { reference: 'n', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] });
}

const children = [
  // Capa
  new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Treine seu Paladar', bold: true, size: 52, color: WINE })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Guia de funcionalidades — para teste (chefes e equipe)', size: 26, color: GREY })] }),
  p([new TextRun('Um app no estilo "Duolingo do vinho": treino diário, curto e divertido, para a pessoa aprender a escolher e entender vinho com confiança. Lições de 2 minutos, com um mascote que guia o caminho. Público: 35 a 54 anos, a maioria iniciante.')]),
  new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 1 } }, spacing: { after: 200 }, children: [] }),

  // Acesso
  h1('Como acessar e instalar'),
  p([new TextRun({ text: 'Link: ', bold: true }), new ExternalHyperlink({ link: 'https://paladar.tchintchin.com.br', children: [new TextRun({ text: 'paladar.tchintchin.com.br', style: 'Hyperlink' })] })]),
  bullet('Funciona direto no navegador do celular ou do computador.'),
  bullet('Android (Chrome): menu (3 pontinhos) -> "Adicionar à tela inicial" / "Instalar app".'),
  bullet('iPhone (Safari): botão Compartilhar -> "Adicionar à Tela de Início".'),
  bullet('Maiores de 18: na primeira vez, é preciso aceitar os Termos e a Política de Privacidade.'),
  figura(['02-trilha.png'], 200),

  h1('Funcionalidades principais'),

  h2('1. Primeiro acesso (onboarding)'),
  p('Uma abertura curta com o mascote e a primeira lição-tutorial: em poucos toques a pessoa já está acertando perguntas e ganhando os primeiros pontos. No fim, escolhe a meta diária.'),
  comoTestar('abra o app pela primeira vez (ou em uma aba anônima) e siga o fluxo "Começar".'),
  figura(['01-abertura.png'], 200),

  h2('2. Trilha de lições (o coração do app)'),
  p('Uma trilha de unidades e lições no estilo de um joguinho. Cada lição é rápida e mistura formatos. O progresso rende XP (pontos), coroas, ofensiva (dias seguidos) e usa vidas.'),
  comoTestar('na aba Início/Trilha, toque na lição disponível e jogue até o fim. Veja o XP subir e a ofensiva acender.'),
  figura(['03-licao.png', '04-conclusao.png']),

  h2('3. Desafio do Dia'),
  p('Um desafio novo por dia sobre um rótulo. Cria o hábito de voltar todo dia.'),
  comoTestar('aba Desafio -> jogar o desafio de hoje -> ver o resultado.'),
  figura(['05-desafio.png'], 200),

  h2('4. Prática livre'),
  p('Treino à vontade, sem gastar vidas. Bom para revisar sem pressão.'),
  comoTestar('na home, atalho "Prática livre".'),

  h2('5. A Mesa (jogar com amigos)'),
  p('Um grupo com ranking entre amigos. Dá para criar uma mesa, convidar por link/código e deixar privada. Precisa de conta.'),
  comoTestar('aba A Mesa -> criar uma mesa e compartilhar o convite, ou entrar por código. Compare a pontuação no ranking.'),
  figura(['06-mesa.png'], 200),

  h2('6. A Lente (escanear o rótulo)'),
  p('A pessoa tira uma foto do rótulo de um vinho e o app monta na hora um quiz sobre aquele vinho específico. A câmera verifica luz, nitidez e enquadramento e dispara sozinha quando a foto está boa e estável.'),
  comoTestar('na home, atalho "Escanear rótulo" -> apontar para um rótulo de verdade -> aguardar o disparo -> responder o quiz.'),
  figura(['08-lente.png'], 200),

  h2('7. Sala Ao Vivo de Degustação (quiz em grupo)'),
  p('O grande diferencial social: o anfitrião escaneia um vinho, gera um código de sala, e a mesa toda entra pelo código (cada um no seu celular). Todos respondem o mesmo quiz juntos, no estilo Kahoot: o certo/errado só aparece depois que todos responderem, e o ranking sobe ao vivo com o avatar de cada um. O anfitrião controla quando avançar.'),
  p([new TextRun({ text: 'Como testar (precisa de 2 aparelhos):', bold: true, color: GOLD })]),
  passo('No aparelho A: Escanear rótulo -> escaneie um vinho -> criar a sala ao vivo.'),
  passo('Compartilhe o código que aparece.'),
  passo('No aparelho B: Lente -> "entrar numa sala ao vivo" -> digite o código.'),
  passo('No aparelho A (anfitrião): "Começar o quiz" — todos começam juntos.'),
  passo('Respondam; o certo/errado aparece só quando todos responderem, e o ranking sobe ao vivo.'),
  figura(['09-sala-lobby.png', '10-sala-quiz.png']),

  h2('8. Perfil e avatar'),
  p('Cada pessoa escolhe um avatar (personagem) e acompanha seu XP, ofensiva e progresso. O avatar aparece na Mesa e na Sala Ao Vivo.'),
  comoTestar('aba Perfil -> escolher/trocar o avatar -> conferir os números.'),
  figura(['07-perfil.png'], 200),

  h2('9. Conta (salvar o progresso)'),
  p('Dá para usar tudo sem cadastro. Para salvar o progresso e acessar de outro aparelho, a pessoa cria conta por e-mail ou Google — o progresso feito como visitante migra para a conta.'),
  comoTestar('em "Salvar seu progresso", criar conta (e-mail ou Google) e confirmar que o progresso continua.'),

  h2('10. Notificações (opcional)'),
  p('Lembretes amigáveis para manter a ofensiva e avisar do desafio. A pessoa liga/desliga quando quiser.'),
  comoTestar('ativar quando o app pedir, ou no Perfil.'),

  h1('Roteiro de teste em ~5 minutos'),
  passo('Abrir paladar.tchintchin.com.br, aceitar os termos e fazer o onboarding.'),
  passo('Jogar 1 lição completa na Trilha (sentir o ritmo e o XP).'),
  passo('Abrir o Desafio do Dia e responder.'),
  passo('Abrir a Lente, escanear um rótulo de verdade e fazer o quiz.'),
  passo('(Com 2 celulares) Testar a Sala Ao Vivo: criar sala em um, entrar no outro pelo código, começar e jogar juntos.'),
  passo('Criar conta (e-mail ou Google) e conferir se o progresso é mantido.'),

  h1('Como reportar bugs e feedback'),
  p('Ao testar, anote sempre que possível:'),
  bullet('O que você fez (a tela e os toques).'),
  bullet('O que esperava e o que aconteceu.'),
  bullet('Aparelho e navegador (ex.: Android/Chrome, iPhone/Safari).'),
  bullet('Se der erro, um print ajuda muito.'),
  p([new TextRun({ text: 'Sugestão: centralizar o feedback num grupo ou planilha única.', italics: true, color: GREY })]),

  new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'Treine seu Paladar — by Tchin Tchin. Versão em teste de mercado.', size: 18, color: GREY, italics: true })] }),
];

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 30, bold: true, font: 'Arial' }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 25, bold: true, font: 'Arial' }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
      { reference: 'n', levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 280 } } } }] },
    ],
  },
  sections: [{
    properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 } } },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log('OK ->', OUT, '(', Math.round(buf.length / 1024), 'KB )');
});
