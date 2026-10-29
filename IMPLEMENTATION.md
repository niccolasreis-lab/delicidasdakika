# Delícias da Kika — primeira versão privada

Implementação independente inspirada no comportamento público do cardápio indicado. Nenhuma marca, imagem ou código do InstaDelivery foi copiado.

## Entregue
- Catálogo de exemplo com categorias, busca e preços.
- Tamanhos P/M/G, acompanhamento obrigatório, adicionais e observações.
- Carrinho persistente no dispositivo, quantidade e remoção.
- Checkout de teste com entrega/retirada e taxas por zona de exemplo.
- Pedidos persistentes no D1, cálculo de preços no servidor, identificador idempotente com comparação de payload.
- Consulta por token aleatório; histórico neste dispositivo; atualização a cada 15 segundos.
- Endpoint de gestão protegido por ADMIN_TOKEN, listagem e alteração de status de preparo.

## Antes de uso real
- Substituir produtos, preços, ilustrações, contato, endereço, zonas e prazos.
- Implementar administração de catálogo e horários, login de cliente entre dispositivos, comunicação WhatsApp e programa de cashback.
- Configurar ADMIN_TOKEN como segredo de runtime para liberar gestão. Não incluir no código ou URL.
- Não há integração financeira ativa nem simulação de Pix aprovado.

## Cakto
Fontes consultadas: https://docs.cakto.com.br/introduction e https://www.cakto.com.br/api-pix

API Pix exige conta Cakto Banking ativa e ofertas cadastradas. Cada componente do preço (tamanho, adicional, frete) precisa ter representação validada nas ofertas; não é seguro assumir que um link de valor fixo aceita o total arbitrário do carrinho.

Pendente: confirmar aceite da atividade de alimentação pela Cakto, configurar client_id/client_secret no servidor, mapear ofertas e valores, validar criação em ambiente de teste, implementar consulta e webhook autenticado com deduplicação. Só passar o pedido para pago após confirmação do provedor, verificando ID e total. Voltar do checkout não comprova pagamento. Não reutilizar o token de consulta do pedido como credencial Cakto.

## REA
A execução de `npx --yes rea-agents@latest --help` foi tentada em 29/10/2026; a aquisição foi bloqueada pela política de rede para registry.npmjs.org. Posteriormente o repositório oficial foi clonado, as dependências foram instaladas e o REA 6.8.0 foi compilado. O CLI executou sobre 36 scripts públicos mais o HTML (37 arquivos). O inventário foi produzido, mas a análise semântica falhou: procps ps retorna "fatal library error, lookup self" neste ambiente. Não foram validados endpoints ou checkout por REA.
