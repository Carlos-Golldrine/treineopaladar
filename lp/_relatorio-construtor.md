ENTREGA COMPLETA: 6 LPs estáticas em `C:\Users\camargo\Downloads\treino-paladar-app\lp\`, verificadas por screenshot (mobile 412 + desktop 1280, servidas via HTTP) e iteradas contra o brief.

ÁRVORE DE ARQUIVOS (C:\Users\camargo\Downloads\treino-paladar-app\lp\)
```
lp/
  _base.css                 tokens do brief, botoes 3D, moldura de celular, layout editorial (12,5 KB)
  _shots.mjs                loop de screenshots (playwright de tchin-tchin-app, server http local)
  index.html                pagina-indice interna, noindex/nofollow
  mercado/index.html        LP1 · conversa/index.html  LP2 · ocasiao/index.html  LP3
  treino/index.html         LP4 · desafio/index.html   LP5 · trabalho/index.html LP6
  fonts/                    5 woff2 self-hosted copiados do @fontsource do app (Fraunces 600 n+i, Inter 400/600, JetBrains Mono 600) = 108,5 KB
  assets/                   11 screenshots reais do app em webp (9-34 KB cada), mascote-celebra.webp (3 KB), logo-tchin.png (15 KB)
  assets/og/                6 og-images 1200x630 compostas (glifo + phone shot sobre wine-900), 35-51 KB
  _review/                  screenshots de QA (12 full-page + crops)
```

PESOS POR LP (html + css + fontes + imagens, og fora do load): mercado 211 KB · conversa 243 KB · ocasiao 208 KB · treino 217 KB · desafio 222 KB · trabalho 230 KB. Todas < 400 KB. Zero framework, zero JS na página.

DECISÕES DE COPY (headline principal = candidata 1 da DD, como instruído; variantes 2 e 3 comentadas no HTML):
- LP1 "Escolha vinho no mercado sem medo de errar." · CTA "Começar o treino (grátis, leva 2 minutos)" 3x · citação S2093
- LP2 "Tudo o que você sempre quis saber de vinho e nunca teve coragem de perguntar." (frase literal do público) · CTA "Vem treinar com a gente" · citações S2435 + S2544 inline
- LP3 "Presente, jantar, primeiro encontro: chegue com o vinho certo." · CTA "Que tal experimentar?" · citação S2370, macarrão S2627 inline; parágrafo "seco, meio seco e suave são gostos, nunca degraus" (C6)
- LP4 (candidata a principal da marca) "Paladar não é dom. É treino." · CTA "Começar o treino" · citação S2161; metáfora academia série/repetição/descanso; honestidade explícita ("ninguém vira sommelier em um mês")
- LP5 (flight desafio, hero escuro + CTA gold) "Você acha que entende de vinho? O Desafio do Dia responde." · CTA "Encarar o desafio de hoje" · citação S2626 com a contagem real de curtidas; provocação dirigida ao paladar, erro celebrado ("erraste lindamente"), zero menção a tecnologia (C5)
- LP6 "Começou a trabalhar com vinho? Aprenda o essencial antes de segunda-feira." · CTA "Começar o treino hoje" · citação S2436; promessa limitada ao que existe (sem prometer trilha "trabalho" ainda, C4 pendente sinalizada em comentário HTML)

Prova honesta padronizada (CONAR): 30 lições verificadas, 12 mil+ vinhos reais, 5.692 rótulos fotografados, 2 min/lição, nota "sem estrela inventada, sem contagem de gente que não existe". Prova visual: 3 shots reais por LP em moldura de celular CSS + mascote Tchin em medalhão. Rodapé: lockup by Tchin Tchin (logo real em tile claro), selo Beta, "Conteúdo para maiores de 18 anos. Beba com moderação: o paladar agradece.", link /privacidade. UTMs: `/comecar?utm_source=lp&utm_medium=organic&utm_campaign={mercado|conversa|ocasiao|treino|desafio|trabalho}`.

BUGS PEGOS E CORRIGIDOS NA ITERAÇÃO DE SCREENSHOT: (1) imagens esticadas por atributo height sem `height:auto`; (2) strong invisível (wine sobre wine) no hero escuro da LP5; (3) URLs de fonte no CSS resolvendo para fora de /lp; (4) logo wine invisível no rodapé escuro (tile claro + troca para PNG, o webp RGBA do PIL não renderizou no Chromium); (5) miolo vazio de 4 shots removido por splice de fundo (emenda invisível, conteúdo intacto).

AUTOCRÍTICA: (a) "Paladar não é dom. É treino." colide com a proibição de fórmula "não é X, é Y" do brief, mas é a candidata 1 sancionada pela DD e carrega o nome do produto; mantive por instrução, registrando o conflito para o time arbitrar. (b) "12 mil+" vem do enunciado da tarefa; o CLAUDE.md cita ~11,4k elegíveis na view estrita, então se o board preferir rigor máximo, trocar por "11 mil+" é um sed de 1 minuto. (c) LP3 é a mais fraca em prova visual: não existe shot de exercício de harmonização nos _shots, usei trilha + ficha de preço + micro-aula; quando o app gerar um shot de swipe "combina/não combina", substituir. (d) As 6 páginas compartilham esqueleto (consistência de marca e custo de manutenção baixo), o que pode soar repetitivo para quem navegar entre elas; visitantes de aquisição veem 1 só. (e) og:image usa caminho root-relative com comentário para prefixar domínio na publicação.
