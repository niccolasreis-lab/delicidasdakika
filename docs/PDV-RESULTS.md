# PDV e estoque — entrega e validação

Data: 2 de novembro de 2026. Branch: `feat/kika-pdv-stock`.

Estado: publicada na Vercel em 2 de novembro de 2026, após autorização explícita para a migração aditiva. Commit publicado: `425df24a01686c4b2a826392f2a3b67a10307d71`. O preflight executou e validou as três tabelas novas. Nenhuma venda, ajuste de estoque, alteração do catálogo ou cobrança foi executada como teste em produção.

## Alterações e componentes

- Nova aba **PDV e estoque**, com disponibilidade por data, produto e tamanho. Mudanças de estoque usam versão; uma tela antiga não sobrescreve uma venda ocorrida em outra tela.
- Venda de balcão/WhatsApp com múltiplos itens, P/M/G, acompanhamento, adicionais, observações, taxas, modalidade e faixa de horário. Nome obrigatório; telefone opcional apenas no balcão.
- Dinheiro, cartão na maquininha e Pix conferido manualmente. Recebimento marcado pela proprietária, separado do preparo. O painel não processa cartão nem confirma Pix automaticamente.
- Checkout para pagar na entrega/retirada quando a loja sai explicitamente da demonstração. Produtos/tamanhos sem estoque configurado não podem ser vendidos. Site e PDV descontam a mesma disponibilidade.
- Estoque e pedido gravados em uma transação. Falta de um único item reverte a operação inteira. Identificador e token preservam o total original nas retentativas.
- Cancelamento pelo cliente somente no estado recebido, com token do pedido, mesma origem e versão. Devolve estoque uma vez. Pagamento recebido fica com reembolso pendente; confirmação manual de devolução é exclusiva da proprietária.
- Não comparecimento na retirada não paga: opção explícita de devolver ou manter as unidades descontadas. Pedido concluído exige recebimento integral registrado.
- Horário limite para pedir separado das faixas de entrega/retirada, em São Paulo, com regras semanais e exceções por data. Sem limite de capacidade por faixa.
- Rascunho do PDV permanece ao alternar abas. Recarregar/fechar uma venda não registrada emite aviso. Alterações não publicadas no catálogo bloqueiam o PDV até salvar ou descartar.

## Arquivos modificados

| Área | Arquivos |
|---|---|
| Interface | `app/admin/page.tsx`, `app/admin/admin.css`, `components/admin-pdv.tsx`, `app/page.tsx` |
| APIs | `app/api/admin/pdv/route.ts`, `app/api/admin/stock/route.ts`, `app/api/admin/route.ts`, `app/api/catalog/route.ts`, `app/api/orders/route.ts` |
| Regras | `lib/catalog-model.ts`, `lib/pdv-engine.mjs`, `lib/pdv-errors.ts`, `lib/sales.ts` |
| Persistência e build | `drizzle/0002_kika_pdv.sql`, `scripts/db/pdv-schema.mjs`, `scripts/db/kika-schema.mjs`, `scripts/db/ensure-turso.mjs`, `vercel.json` |
| Testes | `tests/pdv-engine.test.mjs`, `tests/turso-config.test.mjs`, `tests/vercel-local-api.mjs`, `package.json` |
| Documentação | `docs/PDV-PLAN.md`, este relatório |

Não foram alteradas dependências, credenciais, URLs de serviços, webhooks, políticas de sessão ou as treze colunas existentes em `orders`. As novas tabelas são `kika_stock`, `kika_sale` e `kika_sale_event`. Não há exclusão ou migração de pedidos antigos.

## Funcionalidades preservadas e verificadas

Catálogo e busca, fotos/otimização de imagens, disponibilidade por data, adicionais e preços no servidor, taxas, demonstração, consultas por token, idempotência, persistência após reinício, login, bloqueio de cadastro público, troca de senha, logout, limite de tentativas e proteção administrativa por sessão/origem.

A API administrativa anterior continua atendendo os registros legados. Ela recusa alterar vendas novas diretamente para evitar contornar as regras de estoque/pagamento; essas vendas usam as ações do PDV. Pedidos antigos mantêm seus totais e sua forma de consulta.

## Testes e resultados

| Verificação | Resultado |
|---|---|
| Baseline anterior | 29/29 regressões aprovadas |
| Regressão e regras novas | 40/40 aprovadas |
| Integração Next.js de produção + SQLite temporário | 28/28 cenários aprovados; 29 testes Node incluindo o contêiner |
| Build de produção, webpack | Aprovado |
| TypeScript | Aprovado |
| Lint dos módulos novos/administrativos alterados | Sem erros ou avisos |
| Lint global | 13 erros e 4 avisos preexistentes em `app/page.tsx` e `lib/menu.ts`; baseline documentado tinha 14 erros e 4 avisos |
| Whitespace/diff | Aprovado |

Os cenários novos cobrem concorrência com duas conexões disputando a última unidade, rollback de carrinho com tamanhos mistos, soma de linhas repetidas, versão de estoque antiga, repetição de venda, conflito de intenção, cancelamento com token errado, devolução única, reembolso pendente, travamento após início do preparo, conclusão sem pagamento, não comparecimento, origem inválida, compartilhamento entre site e PDV, total alterado e faixa inválida. Cliente não pode forjar recebimento nem ativar Pix ainda não conectado.

Os testes usam exclusivamente dados sintéticos e banco temporário removido ao final. Build/teste não são evidência de inspeção visual: o novo PDV ainda precisa de verificação em navegador, Android/iOS, teclado virtual e leitor de tela. Não foram capturadas imagens do novo PDV e não é declarada acessibilidade integral.

## Pagamentos ainda pendentes

Pix dinâmico com QR Code, confirmação automática, webhook, reembolso pelo gateway, reserva de quinze minutos e tratamento de pagamento tardio **não estão implementados nem ativados**. Não existe simulador passando por integração real. O painel identifica Pix manual claramente, e a opção automática fica indisponível.

Foi conferida somente a presença dos nomes das variáveis do projeto: nenhuma configuração de API Cakto foi encontrada. Não foram lidos valores secretos. O acesso à conta e ao staging precisa ser configurado por meio seguro antes da etapa de gateway. Ver as referências e restrições no plano.

## Commits de implementação

- `bfb67c3887a44ffe639700430bd0e1131f61f8ef` — estoque transacional e ciclo de vida da venda.
- `ca8ce7884982fd1c3639c11906170319f95e1d90` — painel, checkout, agenda e integração das rotas.
- Documentação em commit separado na mesma branch.

Os commits remotos contêm árvores idênticas às versões locais testadas. Não houve merge na branch principal.

## Publicação segura e rollback

1. Concluído: criação aditiva das três tabelas autorizada pelo responsável e executada no deploy com `--initialize-pdv`. O schema original de treze colunas e as sete tabelas administrativas foram validados.
2. Concluído: deploy de produção READY. O catálogo público retornou dez produtos e permaneceu em demonstração. A migração não muda preços, quantidade disponível, horários ou modo da loja.
3. Validar login e interface nos dispositivos. Conferir os produtos, fotos reais, preços, endereço, taxas, agenda e disponibilidade com a Kika.
4. Liberar operação comercial pelo painel somente após essa conferência. Pix automático permanece bloqueado até a validação da integração externa.

Preview Vercel não pode inicializar o banco de produção compartilhado: o preflight bloqueia a conexão antes de qualquer inicialização quando o ambiente não é Production. Para preview funcional, preparar um banco isolado por procedimento revisado.

O rollback deve preservar as tabelas criadas. Antes de vendas com estoque, o deploy administrativo anterior pode ser reativado mantendo a demonstração. Depois de vendas com estoque, pausar novos pedidos e preservar todas as tabelas. Evitar reabrir o código anterior, que não conhece o estoque nem os novos estados. Preferir correção compatível; nunca apagar tabelas como rollback.

Para reproduzir: `pnpm run test:regression`, `pnpm run build:vercel`, `pnpm run test:api`, `node node_modules/typescript/bin/tsc --noEmit`. Nunca executar os testes de API contra a produção.


## Verificação após publicação

- Deploy Vercel: READY, build de produção concluído; compilação e TypeScript aprovados.
- Preflight: schema original com treze colunas validado, sem inicializar novamente a tabela; sete tabelas administrativas e três tabelas do PDV validadas.
- HTTP GET `/`, `/admin` e `/api/catalog`: 200.
- Catálogo: dez produtos, demonstração preservada e campo de disponibilidade presente.
- HTTP GET `/api/admin/stock` sem sessão: 401.
- HTTP POST e PATCH `/api/admin/pdv` sem sessão: 401. Nenhum pedido foi criado por essas verificações.
- Tela de login abriu no navegador. O console observado não apresentou erro da aplicação; os únicos registros de erro eram de uma extensão do navegador.
- Consulta de logs de runtime do novo deployment, filtrada por error/fatal na janela de dez minutos: nenhum grupo de erro retornado. Esta verificação pontual não substitui monitoramento contínuo; drains e cobertura de monitoramento não foram auditados.
- Sessão autenticada e interface interna do novo PDV em produção continuam pendentes de validação no navegador. Login e ações internas já foram testados no servidor de produção local com conta e banco sintéticos. Android/iOS reais e teclado virtual continuam pendentes.

Endereço de acesso: https://delicias-da-kika.vercel.app/admin . Não publicar senhas nem tokens junto ao relatório.
