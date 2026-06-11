# Import do banco de vinhos no Supabase

Passo a passo para quando o projeto Supabase existir. Pré-requisitos: [Supabase CLI](https://supabase.com/docs/guides/cli) **ou** `psql` instalado, e os arquivos gerados pelo pipeline F0 (`scripts/pipeline_f0.py`).

## 0. Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `supabase/migrations/0001_vinhos.sql` | enum `tipo_vinho`, tabela `vinhos`, `vinhos_quarentena`, indexes |
| `supabase/migrations/0002_app.sql` | tabelas do app (profiles, trilha, economia, Mesa, factory) |
| `data/vinhos_clean.csv` | dados (UTF-8 com BOM, header na 1a linha) |

## 1. Criar o projeto e vincular

```bash
# uma vez, na raiz do repo (treino-paladar-app/)
supabase login
supabase init                  # se a pasta supabase/ ainda nao estiver vinculada
supabase link --project-ref <PROJECT_REF>   # ref do dashboard (Settings > General)
```

## 2. Aplicar as migrações

### Via Supabase CLI (recomendado)

```bash
supabase db push
```

O CLI aplica `0001_vinhos.sql` e `0002_app.sql` em ordem e registra no histórico de migrações.

### Via psql (alternativa)

A connection string fica em Dashboard > Settings > Database (use o pooler em modo *session* para DDL):

```bash
psql "postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" \
  -f supabase/migrations/0001_vinhos.sql \
  -f supabase/migrations/0002_app.sql
```

## 3. Importar o CSV

O `\copy` roda no cliente (o arquivo fica na sua máquina, não no servidor) — é o caminho certo para os ~13k registros.

```bash
psql "postgresql://postgres.<ref>:<senha>@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

No prompt do psql:

```sql
\copy vinhos FROM 'C:/Users/camargo/Downloads/treino-paladar-app/data/vinhos_clean.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

Notas:
- O BOM do UTF-8 é tolerado pelo `COPY ... ENCODING 'UTF8'` no header (a 1a coluna é lida com BOM mas o HEADER descarta a linha). Se o psql reclamar, gere uma cópia sem BOM: `python -c "open('vinhos_clean_nobom.csv','w',encoding='utf-8').write(open('data/vinhos_clean.csv',encoding='utf-8-sig').read())"`.
- A ordem das colunas do CSV é a mesma do `CREATE TABLE` (o pipeline e a migração foram gerados juntos). Se mudar uma coluna, liste-as explicitamente: `\copy vinhos (id, nome, ...) FROM ...`.
- Booleanos vêm como `True`/`False` do pandas — o Postgres aceita.
- Células vazias viram NULL automaticamente em FORMAT csv.

### Alternativa sem psql: Table Editor

Dashboard > Table Editor > tabela `vinhos` > Insert > Import data from CSV. Funciona, mas é mais lento e falha em arquivos grandes; prefira `\copy`.

## 4. Verificação pós-import

```sql
select count(*) total,
       count(*) filter (where view_estrita) as view_estrita,
       count(*) filter (where preco_valido) as preco_valido,
       count(distinct tipo) as tipos
from vinhos;
-- esperado: total = 12958, view_estrita = 11064 (confira com data/QA-pipeline.md da execução vigente)

select tipo, count(*) from vinhos group by tipo order by 2 desc;
```

## 5. Reimport (idempotência)

Para recarregar do zero após nova execução do pipeline:

```sql
truncate table vinhos cascade;  -- cascade por causa de exercicios.vinho_id
\copy vinhos FROM '.../vinhos_clean.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
```

## 6. Depois do import

1. Ativar as policies de RLS comentadas no fim de cada migração.
2. Subir as imagens baixadas (`data/imagens/`) para o Storage (`bucket rotulos`) e popular `thumbnail_url`.
3. Apontar a fábrica de questões para `select * from vinhos where view_estrita`.
