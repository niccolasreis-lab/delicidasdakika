# PDV, estoque diário e agenda — plano seguro

## Auditoria e baseline

Base: branch administrativa já publicada. Implementação nova isolada em `feat/kika-pdv-stock`, sem alterações locais de terceiros no início. Arquitetura preservada: Next.js 16.3.4 / React 19.2.6, TypeScript, Better Auth e Drizzle/libSQL. Nenhuma dependência adicionada.

Fluxos protegidos: catálogo e fotos, sessões e troca de senha, carrinho, adicionais/tamanhos, cálculo no servidor, taxas de entrega, consultas por token, pedidos legados e repetição idempotente. Baseline: 29 testes de regressão aprovados. As treze colunas originais de `orders` permanecem iguais.

## Decisões alinhadas

- Aceite automático, sem aprovação individual da Kika.
- Estoque diário por produto e tamanho; PDV, WhatsApp e site compartilham a disponibilidade.
- Prazo para pedir separado das faixas de entrega/retirada, sem capacidade máxima por faixa.
- Dinheiro, cartão na maquininha e Pix manual conferidos pela responsável no PDV.
- Site pode receber pedido para pagar na entrega ou retirada; estoque descontado imediatamente, sem expiração de quinze minutos.
- Cancelamento pelo cliente antes do preparo devolve estoque. Pagamento recebido vira reembolso pendente até confirmação da devolução.
- Não comparecimento é registrado pela Kika; devolver estoque é uma decisão explícita.
- Pix dinâmico automático, reserva por quinze minutos, webhook e pagamento tardio dependem da integração real. Não há simulação de gateway.

## Etapas

1. Migração estritamente aditiva para disponibilidade, metadados da venda e histórico das operações. Sem dados de produção nos testes.
2. Transação única para validar preços/agenda, descontar estoque e registrar pedido; retentativas mantêm o pedido original.
3. Rotas de estoque e PDV com sessão da proprietária, mesma origem e controle de versões.
4. Interface de estoque, vendas e ações de pagamento/preparo; checkout continua compatível com demonstração.
5. Testes locais do build de produção, concorrência, cancelamentos, autorização e regressão.
6. Revisão e autorização da migração/publicação, depois inspeção visual em dispositivos. Nenhum merge automático.

## Pagamentos e bloqueio externo

A conta Cakto não está conectada nesta sessão e não há configuração de API Cakto no projeto. A documentação oficial vincula a cobrança Pix a uma oferta e ao respectivo preço. O fluxo de valor variável do PDV precisa ser validado com essa modelagem antes de cobrar. Não alterar uma oferta em uso para ajustar outra venda.

O ambiente de staging tem credenciais próprias, fornecidas pelo suporte. Não deduzir seu endereço nem testar cobranças em produção. A ativação exigirá validar valores em centavos, idempotência, autenticação de webhook, consulta de pagamento, expiração real e pagamento após liberação da reserva. Reembolsos automáticos não estão implementados.

Referências oficiais consultadas:

- https://www.cakto.com.br/api-pix
- https://docs.cakto.com.br/api-reference/payments/create-pix
- https://docs.cakto.com.br/api-reference/offers/create
- https://docs.cakto.com.br/conceitos/ambientes

## Publicação e rollback

A migração nova precisa ser aprovada antes de executar `--initialize-pdv` no banco publicado. O comando configurado para o próximo deploy cria somente três tabelas novas, com validação de colunas; não configura saldo, estoque, credenciais nem altera o catálogo existente.

Builds Vercel fora de Production recusam inicialização antes de abrir conexão, evitando que um preview com configuração compartilhada migre o banco publicado. Para preview funcional, usar um banco isolado e preparar seu schema por procedimento próprio revisado.

Antes da ativação comercial, a Kika deve conferir os produtos, fotos, preços, endereço, taxas, estoque e agenda. O modo de demonstração é preservado até ser alterado explicitamente no painel.

Para rollback, pausar novos pedidos e preservar todas as tabelas e vendas. Antes de existir venda real, é possível voltar ao deploy administrativo anterior. Depois de existirem vendas com estoque, preferir correção compatível: o código anterior não conhece a disponibilidade nem os novos estados e não deve ser reaberto para novos pedidos. Nunca apagar tabelas para reverter a interface.
