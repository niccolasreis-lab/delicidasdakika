# Delícias da Kika — validação da publicação

Site: https://delicias-da-kika.vercel.app/

A publicação na Vercel está READY, em Production, com Next.js 16.3.4. A versão de aplicação publicada é o commit público 02a1061ac0c019be33698c4ed4befdc5c37adbf9. O código está isolado na branch deploy/vercel; nenhum merge na principal foi realizado. A versão anterior para Cloudflare/Vinext permanece na branch design/kika-safe-ui.

Este relatório público contém resultados e instruções de manutenção. Não contém credenciais ou inventário interno da infraestrutura.

## Alterações e arquivos

| Arquivo | Finalidade |
|---|---|
| db/index.ts | Driver libSQL com inicialização tardia e configuração exclusivamente no servidor. |
| app/api/admin/route.ts | Adaptação da leitura da chave administrativa ao runtime Vercel; autorização Bearer e estados preservados. |
| package.json, pnpm-lock.yaml | SDK de banco com versão exata, scripts de build Next.js e testes. |
| scripts/db/ensure-turso.mjs, scripts/db/turso-target.mjs, scripts/db/kika-schema.mjs | Verificação de conexão e do schema original; inicialização restrita ao novo recurso aprovado e somente se vazio. Recusa outros destinos, tabelas fora do escopo e schemas incompatíveis. |
| vercel.json | Verificação do banco e build nativo. |
| app/layout.tsx, app/site.css, app/kika-theme.css | Entrada CSS única para preservar a ordem base → tema e a importação válida das fontes. |
| tests/turso-schema.test.mjs, tests/turso-config.test.mjs | Segurança do schema, configuração e sigilo dos logs. |
| tests/vercel-local-api.mjs | Integração real do servidor Next.js com banco temporário local. |
| docs/vercel-smoke.json, docs/vercel-final-desktop.jpg | Evidências HTTP e captura da versão final. |

Foram preservados o schema e SQL originais, contratos da API de pedidos, catálogo, cálculos em centavos, fretes, estados do frontend, identidade visual e imagens. O banco Cloudflare anterior não foi acessado nem migrado. Não foram alteradas credenciais ou políticas de autenticação.

## Testes e resultados

| Verificação | Resultado |
|---|---|
| Build de produção local e na Vercel | PASS |
| TypeScript | PASS |
| Regressão de cálculos e entradas inválidas | 14/14 PASS |
| Inicialização e preservação do schema | 3/3 PASS |
| Configuração, destino e sigilo de logs | 5/5 PASS |
| Integração Next.js + libSQL local | 11/11 cenários PASS |
| Verificações HTTP da publicação | 23/23 PASS |
| Lint | 14 erros e 4 avisos preexistentes; nenhum novo apontamento |
| Console e runtime amostrados | Nenhum erro da aplicação observado |

Os 22 testes de regressão/segurança passaram. O teste de integração tem 11 cenários, contados como 12 testes pelo Node ao incluir o contêiner. Os registros foram fictícios, exclusivamente em banco local descartável.

O build remoto confirmou a conexão real e os 13 campos do schema. Na primeira execução criou somente a tabela original no banco novo vazio; no build final preservou a tabela existente. Não houve importação, alteração ou exclusão de dados anteriores.

Os cenários locais verificaram cálculo pelo servidor, retentativa idempotente, rejeição de conflito, consulta por token, preservação de totais, entradas inválidas, acesso administrativo negado/autorizado com chave fictícia, atualização de status e persistência após reiniciar o servidor.

## Fluxos observados no navegador publicado

Confirmados: catálogo, filtro Bebidas com duas opções e retorno a Todos; personalização de duas marmitas G com Legumes e ovo (R$60,80); carrinho; entrega de R$5,00 e de R$8,00 (total R$68,80); persistência do carrinho ao recarregar; remoção dos itens locais de teste; informações da loja e modo de animação Suaves selecionado.

Nenhum pedido foi enviado ao banco remoto e nenhum pagamento foi executado. O carrinho foi devolvido ao estado vazio observado inicialmente. A consulta de pedido inexistente retornou 404 e a gestão sem chave retornou 401, conforme o contrato.

Na captura final, o navegador confirmou banner vinho, texto creme, títulos Nunito e corpo Inter. Na largura desktop observada de 1348px, o documento também mediu 1348px, sem overflow horizontal.

![Página publicada após correção do tema](vercel-final-desktop.jpg)

A inspeção visual detectou e corrigiu uma regressão do build nativo: a base sobrescrevia o tema por ordem do CSS, causando contraste ruim no banner. Uma única entrada CSS passou a importar base e tema na ordem explícita. O build final e os estilos computados confirmaram a correção.

Erros de uma extensão do navegador foram separados dos logs da aplicação. A ausência de erros na amostra não substitui monitoramento contínuo nem garante ausência universal de falhas.

## Limites, riscos e pendências

- Cakto/Pix, webhooks e envio WhatsApp ainda não estão implementados. O checkout informa que o registro é de demonstração e não gera cobrança ou preparo real.
- A chave administrativa de produção ainda precisa ser configurada pelo proprietário com segurança. A gestão autorizada foi validada somente no banco local com chave fictícia.
- Produtos, preços, contato, horários e regiões de entrega ainda são demonstrativos e precisam de validação comercial. As fotos são ilustrativas.
- Android/iOS físicos, teclado virtual e leitores de tela não foram testados. A nova simulação mobile não pôde ser concluída nesta etapa por limitações do navegador ao acessar o harness local. As evidências anteriores em 320/390/768/1280px estão em docs/safe-ui/ e não equivalem a novos testes deste deployment.
- Não foram enviados pedidos reais para testar o site publicado. O fluxo completo de escrita foi validado localmente.
- O lint continua com falhas anteriores documentadas; não é declarado aprovado.
- A proteção do deployment não foi desativada para viabilizar testes. A URL pública principal abriu sem login.

## Reproduzir os checks locais

    pnpm install --frozen-lockfile
    pnpm run test:regression
    pnpm run build:vercel
    pnpm run test:api
    node node_modules/typescript/bin/tsc --noEmit
    pnpm run lint

Os testes de API criam e removem apenas seu banco temporário local. Não executá-los contra bancos de clientes.

## Commits públicos

- 48353dcc5433113bb278e3f9e7d84522cb470e98 — adaptação da persistência e testes locais.
- 4b09f732c152d30223c49efae5fa9c738b093917 — diagnóstico sem exposição de credenciais.
- 3b9eb45983c953d1e5d88857a0416001e48f7170 — testes adicionais de configuração.
- 9eea07c9af3337754df70316b27c884b97040928 — restrição ao recurso de banco aprovado.
- 02a1061ac0c019be33698c4ed4befdc5c37adbf9 — correção da ordem do tema; versão publicada final.
- O commit deste relatório adiciona documentação e evidências, sem alterar a aplicação publicada.

## Rollback e publicação segura

Esta é a primeira versão Vercel validada também visualmente. Guardar a versão correspondente ao commit 02a1061 como referência para rollback de releases futuros pelo painel Vercel. A publicação anterior tinha a regressão visual descrita e não deve ser escolhida como referência visual saudável.

Para reverter código, usar commits de reversão exclusivamente nesta branch. A branch de design preserva o runtime Cloudflare; restaurá-la exige hospedagem compatível e não corrige um deployment Vercel por si só.

Não excluir banco, apagar pedidos, remover credenciais ou reverter a criação da tabela como rollback. Não copiar dados do banco anterior sem autorização específica.

Antes de iniciar vendas: configurar a gestão, validar dados comerciais, concluir pagamentos e operação de entrega, testar aparelhos reais e repetir o fluxo de ponta a ponta em sandbox. O deploy não ativa essas funcionalidades pendentes.
