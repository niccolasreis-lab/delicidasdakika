# Vercel — preparação de publicação

Data: 29/10/2026. Branch `deploy/vercel`.

## Concluído

- Código e assets da versão validada enviados ao GitHub na branch `design/kika-safe-ui`.
- Commit remoto de referência: `e7931e76847e8d057dbd00e88b3c22004249bd6a`.
- Projeto Vercel criado na equipe do proprietário: `delicias-da-kika`.
- Build configurado como Next.js nativo, Node.js 24.x, dependências pelo lockfile existente.
- A versão Cloudflare/Vinext permanece preservada na branch de design. Nenhuma alteração em banco, API, segredo ou pagamento foi realizada nesta preparação.

## Bloqueio confirmado no build local

O build anterior validado é o de Cloudflare/Vinext. O build nativo de Next.js, necessário para publicar esta aplicação na Vercel, foi executado e falhou:

```text
cloudflare:workers
UnhandledSchemeError: Reading from "cloudflare:workers" is not handled by plugins
Import trace: ./app/api/admin/route.ts
```

Há também dependência de `cloudflare:workers` e do driver D1 em `db/index.ts`. Este vínculo de banco pertence ao runtime Cloudflare; configurar a Vercel não o torna disponível em Node.js. Não foi removida a API ou substituída a persistência por armazenamento de navegador para simular um deploy funcional.

A publicação continua pendente. Nenhum deployment saudável foi declarado e nenhum schema foi aplicado ou alterado remotamente.

## Proposta concreta que exige autorização separada

A instrução de preservação do usuário exige aprovação para alterações estruturais de banco e integrações. A autorização de deploy não foi interpretada como autorização para trocar silenciosamente o provedor de dados.

Caminho recomendado para revisão: um banco Turso/libSQL novo e isolado, compatível com o schema SQLite existente. O banco Cloudflare atual permanece intacto. Não há migração automática de dados de clientes.

Alterações necessárias, após aprovação:

1. Adicionar `@libsql/client` e usar `drizzle-orm/libsql` na branch de publicação. Manter `db/schema.ts`, nomes de campos, valores em centavos e limites atuais.
2. Adaptar `db/index.ts` para inicialização tardia com as credenciais do banco, exclusivamente no servidor. Não incluir segredos no código ou no navegador.
3. Trocar a leitura de `env.ADMIN_TOKEN` do runtime Cloudflare pela variável de ambiente equivalente na Vercel, sem mudar a verificação de autorização da gestão.
4. Provisionar somente um banco novo para a Kika e aplicar nele o SQL já existente. Não tocar no D1 nem copiar dados sem autorização específica.
5. Configurar as variáveis no runtime da Vercel, incluindo o acesso administrativo quando disponibilizado pelo proprietário, por mecanismo seguro.
6. Repetir build nativo, TypeScript, os 14 testes unitários e os fluxos de pedido, retentativa, consulta por token, frete e negação de acesso da gestão em ambiente de teste.
7. Publicar, verificar URL e chamadas de API; não afirmar confirmação Pix ou webhook, que ainda não estão implementados.

Alternativa: manter o backend no Cloudflare e adicionar uma API autenticada para o frontend da Vercel. Isso também requer nova configuração de acesso entre serviços e revisão de autenticação; não foi feito automaticamente.

## Rollback

A configuração Vercel está isolada nesta branch. A branch de design mantém o runtime que já foi validado. Não executar migrações, não excluir o banco e não alterar segredos como parte de um rollback de configuração de build.

## Fontes técnicas

- https://orm.drizzle.team/docs/get-started/turso-existing
- https://github.com/tursodatabase/libsql-client-ts

Esta proposta não comprova que o banco novo está provisionado ou a integração foi validada. Essas ações permanecem pendentes de autorização e execução.
