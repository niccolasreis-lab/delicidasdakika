# Painel administrativo — implementação e testes

Estado: implementado na branch isolada feat/kika-admin-dashboard, validado localmente e ainda não publicado. A ativação das credenciais protegidas em produção depende de autorização específica. Não foram criados usuários ou tabelas administrativas no banco publicado nesta etapa.

## Funcionalidades implementadas

- Login por nome de usuário, sessão em cookie protegida, logout e troca de senha autenticada.
- Conta única da responsável, sem cadastro público. Operações administrativas verificam a sessão no servidor; gravações por cookie também exigem mesma origem.
- Limite persistente de tentativas de login. Endpoints de autenticação não utilizados ficam indisponíveis.
- Dashboard com abas Meus pratos, Funcionamento, Pedidos e Minha senha.
- Cadastro e edição de nome, descrição, categoria, preço, acréscimos de tamanho, destaque e dias habituais do produto.
- Disponibilidade por data e ocultação do produto sem apagar os pedidos anteriores.
- Fotos escolhidas da galeria, otimizadas e persistidas. O servidor aceita somente imagens JPG/PNG/WebP válidas, com limite de tamanho e frequência de envio. A interface reduz a imagem antes do upload.
- Agenda semanal em horário de São Paulo, pausas imediatas e exceções para uma data. Entrega, retirada ou ambas por dia e janela de atendimento.
- Edição das taxas de entrega, preços dos adicionais, aviso, endereço de retirada e prazo estimado.
- Catálogo público dinâmico: novas visitas recebem a edição salva; páginas já abertas atualizam periodicamente e ao voltar ao foco.
- Checkout usa preços e disponibilidade do servidor. Se o total mudou enquanto a página estava aberta, o cliente precisa revisar antes de registrar o pedido.
- Histórico e valores registrados são preservados; retentativas idempotentes mantêm o pedido original mesmo após mudança de preços ou fechamento da cozinha.

## Arquivos principais

| Área | Arquivos |
|---|---|
| Interface | app/admin/page.tsx, app/admin/admin.css, app/page.tsx |
| Autenticação | lib/auth.ts, lib/auth-client.ts, app/api/auth/[...all]/route.ts |
| Modelos e persistência | db/admin-schema.ts, db/index.ts, lib/default-catalog.json, lib/catalog-model.ts, lib/catalog-store.ts |
| APIs | app/api/catalog/route.ts, app/api/admin/catalog/route.ts, app/api/admin/media/route.ts, app/api/media/[id]/route.ts, app/api/admin/route.ts |
| Cálculo e pedidos | lib/menu.ts, lib/order-intent.ts, app/api/orders/route.ts |
| Migração aditiva | drizzle/0001_kika_admin.sql, scripts/db/admin-schema.mjs, scripts/db/kika-schema.mjs, scripts/db/ensure-turso.mjs |
| Build e dependências | package.json, pnpm-lock.yaml, vercel.json |
| Testes | tests/admin-schema.test.mjs, tests/catalog-admin.test.mjs, tests/vercel-local-api.mjs e testes de regressão anteriores |

O schema original de pedidos e suas treze colunas não foram alterados. A migração cria tabelas adicionais e não redefine a senha nem o catálogo em execuções seguintes. Fotos anteriores não são excluídas automaticamente.

## Validação executada

- Build nativo Next.js de produção: PASS.
- TypeScript: PASS.
- Regressão e segurança: 29/29 PASS.
- Integração com servidor Next.js de produção e banco local descartável: 18/18 cenários PASS (19 testes contados pelo Node incluindo o contêiner).
- Lint: os mesmos 14 erros e 4 avisos preexistentes. Os novos módulos foram verificados sem apontamentos introduzidos.
- Checagem de diff: PASS.

Integração cobriu: pedidos e cálculos anteriores, persistência após reinício, login, bloqueio de cadastro público, autorização, origem indevida, edição de preço refletida no catálogo, revisão de preço desatualizado, conflito de edição entre telas, idempotência após alteração, esgotado por data, somente retirada, cozinha fechada, foto válida/inválida, troca de senha, logout e limite de tentativas.

Todos os dados, contas, senhas e imagens de teste desses cenários são sintéticos e locais. Não houve pedido real, cobrança, upload de teste ou alteração de catálogo na produção.

Algumas execuções locais encontraram um manifesto gerado vazio; o artefato de build foi regenerado. A execução final do servidor de produção passou todos os cenários. Não foi alterado código de dependência para contornar o problema.

## Limites e ativação

- A configuração de credenciais protegidas na Vercel foi rejeitada pela revisão automática por exigir autorização explícita para esse destino. Os valores não foram gravados. O site publicado permanece na versão anterior.
- A senha fornecida não está no código ou nos commits; a preparação usa o hash da biblioteca de autenticação. Dados reais de acesso e telefone não são publicados neste relatório.
- A nova interface ainda precisa de inspeção visual e interação no navegador após a ativação, incluindo Android/iOS, teclado virtual e leitor de tela. Não é declarada conformidade completa de acessibilidade ou responsividade baseada somente no build.
- Recuperação automática por SMS não foi implementada. A responsável pode trocar sua senha no painel; recuperação de acesso perdido exige intervenção do administrador do site.
- Pagamentos Cakto/Pix e envio de pedidos por WhatsApp continuam pendentes. Os avisos de demonstração e de ausência de cobrança foram preservados.

## Rollback

Enquanto esta branch não estiver publicada, não há alteração de produção para reverter. As mudanças estão isoladas e podem ser desfeitas por commits de reversão.

Depois da ativação, preservar pedidos, catálogo, fotos e tabelas de autenticação. Não excluir tabelas como rollback. Antes de voltar ao código anterior, pausar novos pedidos e revisar a correspondência de preços: a versão anterior usa catálogo fixo. Preferir uma correção compatível com o catálogo persistido a reexpor preços antigos.

## Reproduzir localmente

    pnpm install --frozen-lockfile
    pnpm run test:regression
    pnpm run build:vercel
    pnpm run test:api
    node node_modules/typescript/bin/tsc --noEmit
    pnpm run lint

Os testes de API criam e removem somente seu próprio banco temporário. Não apontá-los para o banco publicado.
