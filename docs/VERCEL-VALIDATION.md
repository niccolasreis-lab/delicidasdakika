# Vercel — adaptação autorizada e validação

Branch isolada: `deploy/vercel`. O proprietário autorizou o commit, o deploy e a adaptação para um banco Turso/libSQL novo. A branch `design/kika-safe-ui` preserva a versão Cloudflare/Vinext. Nenhum merge na principal foi realizado.

## Infraestrutura confirmada

- Equipe Vercel: `nicolas-reis-projects-04950746`.
- Projeto: `delicias-da-kika`, Next.js, Node.js 24.x.
- Turso Cloud instalado no plano gratuito `starter`.
- Recurso verificado por metadados autenticados da Vercel: `store_ZMvpHwXEd11DUyxM`, nome automático `database-bisque-cushion`, ID externo `01a18a7d-cd01-7479-b1a8-b1d3b8e180ca`, região `iad1`, status pronto, da equipe acima e conectado somente ao projeto Kika em Preview e Production. Os content hints das duas variáveis confirmam esse mesmo recurso. Não foram lidos seus segredos.
- Nomes das variáveis confirmados, sem leitura dos valores: `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`, nos ambientes Preview e Production.
- A presença das variáveis não comprova conexão. O build remoto verifica o acesso real antes de compilar e falha se o destino, acesso ou schema forem incompatíveis.

## Arquivos e comportamento

| Arquivo | Alteração |
|---|---|
| `db/index.ts` | Driver `drizzle-orm/libsql` com `@libsql/client` 0.18.0 e inicialização tardia. A Vercel exige URL remota segura e token. |
| `app/api/admin/route.ts` | Lê `process.env.ADMIN_TOKEN` em vez do binding Cloudflare. Verificação Bearer, contratos e estados preservados. |
| `package.json`, `pnpm-lock.yaml` | Um SDK adicionado com versão exata; scripts para Next.js/Vercel e testes. Dependências anteriores mantidas. |
| `scripts/db/kika-schema.mjs` | Verifica os 13 campos do SQL original. Inicializa somente banco vazio com opção explícita; recusa outras tabelas e schemas incompatíveis. Não executa ALTER, DROP, limpeza ou importação de dados. |
| `scripts/db/ensure-turso.mjs`, `scripts/db/turso-target.mjs` | Restringem o destino ao nome/ID do recurso específico verificado acima, no domínio Turso com protocolo seguro; confirmam conexão e schema. Outros bancos, inclusive com nome da marca, são recusados. Não exibem URL, token ou erros brutos do provedor. |
| `vercel.json` | Verificação do banco seguida do build Next.js. A primeira execução pode criar somente a tabela original no banco novo vazio, conforme autorização. |
| `tests/turso-schema.test.mjs` | Testes reais com libSQL em memória: inicialização, repetição segura, preservação de dados e recusa de bancos fora do escopo. |
| `tests/vercel-local-api.mjs` | Servidor de produção Next.js, SQLite temporário descartável e chave administrativa fictícia. Nunca usa Vercel nem credenciais reais. |
| `app/layout.tsx`, `app/site.css`, `app/kika-theme.css` | Uma única entrada CSS mantém explicitamente a ordem base → tema no build nativo. A importação das fontes foi movida para o início dessa entrada. Tokens, seletores, handlers e componentes preservados. |

`db/schema.ts`, o SQL existente, `lib/menu.ts`, a API de pedidos, preços, fretes, estados do frontend, identidade visual e assets foram preservados. O D1 anterior não foi acessado nem migrado.

## Validação local executada

- Build nativo `next build --webpack`: PASS; página, `/api/orders` e `/api/admin` compiladas.
- TypeScript `tsc --noEmit`: PASS.
- Regressão monetária e entradas inválidas: 14/14 PASS.
- Segurança da inicialização do schema: 3/3 PASS.
- Guardas de configuração e sigilo dos logs: 4/4 PASS (variáveis ausentes, URL inválida, protocolo inseguro e destino fora do escopo; sem conexão externa).
- Restrição ao nome/ID do recurso Kika verificado e recusa de outros bancos/domínios: 1/1 PASS; 10 casos no teste, sem conexão externa.
- Integração Next.js + libSQL: 11/11 cenários PASS (12 testes contados pelo Node, incluindo o contêiner).
- Lint: 14 erros e 4 avisos preexistentes; nenhum apontamento novo. A troca do acesso ao token eliminou um `any` anterior. O baseline tinha 15 erros e 4 avisos.

Integração confirma: página e imagens de marca; total R$68,80 calculado pelo servidor; pagamento `não cobrado`; retentativa idempotente; conflito rejeitado; consulta privada por token; não exposição do token/hash na consulta pública; endereço e quantidade inválidos; gestão sem autorização negada; listagem e alteração de status com chave fictícia; persistência após reiniciar o servidor. Todos os registros são sintéticos e locais.

O primeiro teste do verificador identificou uma expectativa incorreta de nulabilidade no próprio verificador. A expectativa foi corrigida para refletir o SQL original (status e payment NOT NULL); schema e SQL não foram modificados. Os 17 testes unitários passaram após essa correção.

Os primeiros builds remotos pararam antes da conexão porque a guarda presumia o nome da marca no hostname. O recurso recebeu um nome automático da Vercel. Seu proprietário, criação, prontidão, ID e vínculo exclusivo ao projeto foram então confirmados por metadados. A revisão automática rejeitou uma proposta que aceitaria qualquer domínio Turso; essa proposta não foi enviada ao GitHub e foi revertida localmente. A alternativa mantém uma lista restrita ao nome/ID do recurso específico aprovado.

A primeira publicação saudável no backend revelou uma regressão visual no Next.js nativo: o CSS compilado colocou o tema antes da base, que sobrescreveu tokens, fontes e fundo do banner. Isso foi observado no navegador (fundo creme com texto creme) e corrigido com uma única entrada CSS que importa base e tema na ordem explícita. A verificação final deve confirmar vinho no banner e Nunito/Inter; a captura inicial incorreta não é evidência de aceite visual.

## Reproduzir

```bash
pnpm install --frozen-lockfile
pnpm run test:regression
pnpm run build:vercel
pnpm run test:api
node node_modules/typescript/bin/tsc --noEmit
pnpm run lint
```

O build local não inicializa banco remoto. Na Vercel, o `buildCommand` verifica as variáveis pelo SDK e inicializa exclusivamente o banco novo aprovado se vazio. Valida o schema novamente a cada build. Não há endpoint público de migração.

## Limites e pendências

- Conexão real, build remoto e verificações HTTP precisam ser confirmados na Vercel; não são inferidos dos testes locais.
- Não criar pedidos nem executar pagamentos reais para testar o deployment. Em produção, usar consultas sem resultados, negações de acesso e inspeção de página/arquivos.
- `ADMIN_TOKEN` não consta nas variáveis atuais. A gestão permanece negada até o proprietário configurar sua chave com segurança. Sessão autorizada validada somente localmente.
- Cakto/Pix, webhooks e envio WhatsApp ainda não estão implementados. Não são ativados por este deploy.
- Produtos, preços, contato e regiões precisam de validação comercial; fotos são ilustrativas.
- Android/iOS físicos, teclado virtual e leitores de tela não foram testados nesta adaptação. Evidências responsivas anteriores estão em `docs/safe-ui/`.
- A proteção de acesso do deployment não é desativada para testes automatizados.

## Rollback e publicação

O projeto Vercel é novo e o banco antigo permanece intacto. Para rollback de uma versão Vercel já publicada, promover o deployment anterior saudável pelo painel ou pela operação de rollback apropriada. Reverter somente os commits desta adaptação para retornar o código desta branch; isso restaura a dependência Cloudflare, que não roda diretamente na Vercel. A branch de design continua disponível para esse runtime.

Não excluir banco, remover credenciais, apagar pedidos nem tentar reverter a criação da tabela como parte do rollback. O verificador não altera tabelas existentes. Não copiar dados do D1 sem autorização específica. Nenhum merge na principal é necessário para publicar esta branch.

Fontes: https://orm.drizzle.team/docs/connect-turso e https://docs.turso.tech/sdk/ts/reference.
