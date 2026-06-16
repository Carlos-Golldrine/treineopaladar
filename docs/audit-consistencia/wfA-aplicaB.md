Os cinco cards agora batem com a opção correta nos mesmos cortes (40/90/200). Validação concluída.

## Resumo

Apliquei 11 correções nos arquivos do escopo (unidade-5, unidade-6, desafios.json). Os 5 JSON foram validados com `node` (parse limpo) e a coerência card-vs-opção de preço foi conferida.

### Aplicadas

**unidade-5/licao-01.json**
- Item 26: swipe carta 3, campo `texto` → "Queijo curado intenso com vinho **seco** bem levinho"

**unidade-5/licao-03.json**
- Item 27: exercicios[1] mc, `erroMsg` → reescrito incluindo o papel do tanino (time do churrasco)
- Item 28: exercicios[6] mc calibrar, `pergunta` → "...vinho mole, de acidez baixa e pouco tanino..."
- Item 29: exercicios[6], `porque` → "Na fritura, quem varre a gordura é a acidez; sem ela nem tanino..."

**unidade-5/licao-04.json**
- Item 30: exercicios[8] mc fechamento, `pergunta` → "...quem não deve ganhar no açúcar é..."
- Item 31: exercicios[8], `okMsg` → "...a sobremesa de preferência não passa o vinho."

**unidade-6/licao-05.json**
- Item 32: `hook` → "uma das uvas mais tânicas do mundo"
- Item 33: swipe carta 1, `porque` → "Uma das uvas mais tânicas com uma das carnes mais gordas..."
- Item 34: exercicios[7] mc d3, `erroMsg` → "...pouquíssimas uvas têm mais tanino que a Tannat."
- Item 35: `recap` → "...a Tannat, das uvas mais tânicas do mundo..."

**pratica/desafios.json** (Item 39 — unificação dos buckets de preço nos cortes 40/90/200, editado direto no JSON gerado)
- desafio-09: card `faixaPreco` "R$ 40 a 80" → "R$ 40 a 90"
- desafio-15: card `faixaPreco` "R$ 40 a 80" → "R$ 40 a 90"
- desafio-27: card `faixaPreco` "R$ 80 a 150" → "R$ 90 a 200"
- desafio-28: card `faixaPreco` "R$ 80 a 150" → "R$ 90 a 200"
- desafio-34: card `faixaPreco` "R$ 40 a 80" → "R$ 40 a 90"

Cada card agora bate com a opção correta da própria pergunta de preço (verificado por script).

### Não aplicadas (fora do escopo solicitado)
Itens 1–25, 36, 37, 38 do plano. Pertencem a outros arquivos (`onboarding/conteudo.ts`, unidades 1/3/4, e `banco-pratica.json` + `vinhos_clean.csv`), que não estavam no escopo desta tarefa. Nada do escopo (unidade-5/*, unidade-6/*, pratica/desafios.json) ficou sem correção correspondente: não havia outros itens do plano apontando para esses arquivos.

Observação sobre o item 39: como combinado, a correção foi feita direto no JSON (idempotente, fábrica não re-rodada). Ajustei o metadado `faixaPreco` do card para os cortes unificados (40/90/200), igualando-o à opção que cada pergunta já marca como correta. Os valores numéricos das opções e gabaritos não foram alterados — apenas o chip do card, que estava no sistema antigo (40/80/150).
