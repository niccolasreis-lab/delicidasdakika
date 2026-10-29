# Auditoria e plano de modernização segura — Delícias da Kika

Data: 29/10/2026. Base: `74e009294a507e97b9305975f9cc1023d55fceaa`.
Branch de trabalho: `design/kika-safe-ui`. Estado inicial limpo, sem alterações de terceiros. O repositório GitHub informado não tinha branches no início da auditoria; o código preservado nesta sessão foi usado como baseline. Nenhum deploy, merge ou alteração de produção é autorizado nesta etapa. A versão publicada pelo fluxo anterior já existia antes desta instrução.

## Arquitetura e inventário

- React 19.2.6, TypeScript 5.9.3, Next 16.3.4 com Vinext 1.0.0-beta.5 e Vite 8.0.13; pnpm 11.25.0. Execução em Worker Cloudflare, Drizzle 0.45.2 e D1.
- `app/page.tsx`: página cliente que concentra o catálogo e os painéis/modal de produto, carrinho/checkout, confirmação, histórico, informações e gestão. Os painéis são estados na mesma rota, não páginas independentes.
- `app/globals.css`: estilos globais e breakpoints; paleta verde/creme anterior, DM Sans/Playfair Display, aproximadamente 21,8 KB e 63 cores hexadecimais distintas. Componentes visuais e lógica estão próximos; não extrair ou reescrever estados durante a modernização.
- `app/layout.tsx`: idioma pt-BR, metadados e importação de estilos.
- `lib/menu.ts`: 10 produtos, 5 categorias incluindo Todos, 2 adicionais e 2 zonas de exemplo; cálculo de tamanhos, adicionais, quantidade e frete compartilhado com o servidor.
- `app/api/orders/route.ts`: POST registra pedido e verifica chave/payload; GET consulta por identificador e token. Contrato protegido.
- `app/api/admin/route.ts`: GET/PATCH de pedidos, protegidos por segredo de runtime. Não configurar ou trocar segredos nesta tarefa.
- `db/schema.ts`, `db/index.ts`, `drizzle/`: tabela de pedidos e migração existente. Não modificar nem reaplicar migrações nesta tarefa.
- `app/chatgpt-auth.ts`: helper de autenticação de hospedagem, sem uso direto no catálogo. Histórico de cliente usa este navegador e token de consulta, não login de cliente entre dispositivos.
- `worker/`, `lib/connector-*`, `scripts/` e configuração de build: infraestrutura existente. Não alterar.
- `components/ui/`: biblioteca de componentes de base disponível, mas não usada para os controles do catálogo. Não migrar para outra biblioteca durante o ajuste visual.
- `public/images/`: fotografias de terceiros otimizadas em WebP com versões 480 px; referências ilustrativas, créditos em `public/creditos.html`.

## Estados e contratos que devem permanecer iguais

Busca/categoria; produto selecionado; rascunho do produto; tamanho P/M/G; acompanhamento; adicionais; observações; quantidade; carrinho; modalidade; zona; cliente; telefone; endereço; carregamento; erros; histórico; pedido ativo; chave de idempotência; credencial administrativa apenas em memória; listagem administrativa. Chaves locais existentes: `kika-cart` e `kika-history`. Regras monetárias em centavos e limites de validação não serão alterados.

## Funcionalidades existentes e limites

| Área | Estado antes da mudança |
|---|---|
| Catálogo, busca e categorias | Implementados |
| Variações, adicionais, observações e carrinho | Implementados |
| Entrega/retirada e frete | Implementados com dados de exemplo |
| Registro de pedido e consulta por token | Implementados; testes somente no D1 local |
| Histórico e acompanhamento | Neste dispositivo; consulta periódica a cada 15 s |
| Gestão | Listagem e status existentes; acesso autorizado não validado por falta de credencial configurada para o teste |
| Cadastro/edição de produtos, estoque e disponibilidade | Não implementados; catálogo estático |
| Cakto/Pix e webhook | Não implementados; checkout registra teste, sem cobrança |
| WhatsApp | Campo de telefone; não há envio de pedido nem integração ativa |
| Cashback, cupons e descontos | Não implementados |
| Horários e endereço real | Pendentes; não existe bloqueio operacional por horário |

## Baseline técnico e funcional

- `tsc --noEmit`: PASS.
- Build pelo helper oficial de Sites: PASS. Aviso conhecido do Vinext: classificação estática de rotas dinâmica não determinada. Não é falha do build.
- `npm run lint`: FAIL preexistente, 15 erros e 4 avisos. Categorias: `no-explicit-any`, `react-hooks/set-state-in-effect`, `no-html-link-for-pages`, `react-hooks/exhaustive-deps`, `no-img-element`.
- Nenhum comando ou suíte unitária/E2E de projeto foi encontrado. `aspect-ratio.tsx` não é arquivo de teste. Não afirmar cobertura de suíte inexistente.
- 14 verificações locais de cálculo: PASS (ver `baseline-quote.log`).
- 9 verificações de API em `terminal.local`: PASS (ver `baseline-api.json`). Foi criado somente pedido fictício no banco local, sem chamadas financeiras. A retentativa retorna o mesmo pedido; payload diferente na mesma chave é rejeitado; consulta sem token e gestão sem credencial são negadas.
- 10 verificações de UI: PASS (ver `baseline-ui.json`): busca vazia/limpeza, categorias, adicionais, quantidades, frete, preservação ao reabrir checkout, registro de teste, histórico e remoção do último item.
- Responsividade por iframe local: 320/390/768/1280 px. Larguras de conteúdo 305/375/753/1265 px por causa da barra de rolagem. Sem overflow horizontal nas quatro larguras; navbar inferior visível apenas nas duas menores.
- Captura de baseline em `before-mobile.jpg`. Captura com recorte do navegador apresentou timeout; captura de viewport completo funcionou. Não há captura posterior nesta etapa de auditoria.
- Não foi executado Lighthouse nem medição confiável de Core Web Vitals. Tamanho de arquivo não é benchmark de experiência. Não inventar valores de performance.

## Plano visual de baixo risco

1. Introduzir `app/kika-theme.css` com tokens semânticos centrais e aliases para as variáveis existentes. Importar após o CSS atual. Nenhuma troca de framework, rota ou dependência.
2. Usar Nunito para títulos e Inter para corpo, preços e campos. Verificar quebras nas quatro larguras; manter fallbacks do sistema caso fontes externas falhem.
3. Aplicar logo original no cabeçalho e caricatura de cozinha no banner. Manter fotos reais ilustrativas dos produtos, descrição e rotas de assets existentes. Otimizar cópias para a web sem alterar os anexos originais.
4. Ajustar cores, bordas, sombras e foco dos controles existentes. Os handlers, estados, nomes acessíveis e dados permanecem iguais.
5. Introduzir controle visual independente de animações em informações da loja: Desativadas, Suaves (padrão), Completas. Chave de preferência própria; não usar as chaves do carrinho. Não adicionar biblioteca de animação. Sistema com redução de movimento sempre prevalece.
6. Repetir testes, comparar baseline e verificar arquivos de backend por Git. Manter commits separados; não publicar nem fazer merge.

## Contraste da paleta solicitada

| Par | Contraste calculado | Uso |
|---|---:|---|
| Vinho #4A0715 / branco | 15,76:1 | Botões e textos principais |
| Texto #6D4550 / creme #FFF8EE | 7,61:1 | Texto secundário legível |
| Rosa #F72569 / branco | 3,87:1 | Não usar para texto branco pequeno |
| Dourado #F3A64B / creme | 1,92:1 | Decoração; não texto pequeno |
| Cacau #241619 / rosa | 4,51:1 | Alternativa limitada; preferir vinho/branco nos CTAs |

## Riscos preexistentes e limites de validação

- Código da página e CSS muito compactados; evitar refatoração extensa junto à identidade visual.
- Troca de métricas tipográficas pode alterar altura de cards e modais. Medir overflow e áreas de toque após a mudança.
- O modal já contém foco inicial, captura de Tab/Escape e retorno de foco, mas não foi auditado com leitor de tela real. Botão do carrinho no mobile fica identificado apenas pela contagem quando o texto visual é ocultado; registrar separadamente para correção de nome acessível.
- O backend não possui integração financeira. Não confundir registro local com aprovação de Pix.
- Não validados: pagamento, webhook, WhatsApp, autenticação de cliente, acesso administrativo autorizado, teclado virtual nativo, TalkBack/VoiceOver, Android/iOS físicos ou Safari real.
- Preferência de movimento inexistente antes da mudança; `prefers-reduced-motion` já possui regra parcial, sem modos de UI.
- Risco de desempenho: hero usa lazy loading e fontes externas; obter medição real posteriormente, sem prometer melhora não medida.
- Modelo de idempotência e armazenamento do navegador não foram redesenhados. Payloads locais inválidos/antigos podem exigir trabalho separado. Não esconder falhas por mudanças de UI.

## Rollback e publicação

A baseline é o commit `74e0092`. Reverter somente commits da modernização com `git revert`, em ordem inversa, na branch isolada. Não usar `reset --hard`, não apagar dados, não restaurar segredos e não executar migrações como rollback visual.

Publicação exige revisão do diff, regressões resolvidas, aprovação explícita do usuário e validação separada das pendências operacionais. Não habilitar recebimentos ou expor a gestão com base apenas em aprovação visual.
