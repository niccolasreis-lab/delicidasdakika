# Entrega — Safe Design System Delícias da Kika

Data: 29/10/2026. Branch isolada: `design/kika-safe-ui`.
Baseline: `74e009294a507e97b9305975f9cc1023d55fceaa`.

## Alterações realizadas

A identidade da marca foi aplicada de forma incremental na página existente. Foram preservados o framework, os dados dos produtos, os contratos de API, os estados do pedido, as validações e os handlers de negócio. A navegação continua usando os mesmos destinos; apenas sua rolagem visual passou a respeitar a preferência de movimento.

A auditoria e o plano foram registrados antes do primeiro commit visual, em `AUDIT.md`. Não foi executado deploy ou merge nesta tarefa. A principal local permaneceu em `74e0092`.

### Arquivos de aplicação

| Arquivo | Alteração |
|---|---|
| `app/kika-theme.css` | Novo tema: oito cores solicitadas, superfície suave derivada, tipografia, raios, espaçamento, sombras e durações. Aliases preservam os seletores existentes. |
| `app/globals.css` | Apenas remoção da importação das fontes anteriores, substituídas pelo tema. Demais estilos anteriores preservados. |
| `app/layout.tsx` | Importa o tema e monta o sincronizador independente da preferência de movimento. Metadados e idioma preservados. |
| `app/page.tsx` | Aplica logo e caricatura; expõe o controle de animações em informações da loja; dá nome acessível ao carrinho mobile; ajusta a duração da rolagem sem mudar o destino. |
| `components/motion-preferences.tsx` | Novo componente isolado para Desativadas/Suaves/Completas, com Suaves como padrão e chave própria `kika-motion-v1`. Sem dependências adicionais. |
| `public/brand/kika-logo.webp` | Cópia otimizada do logotipo anexado. Original preservado. |
| `public/brand/kika-cozinha.webp` | Cópia otimizada da caricatura anexada. Original preservado. |

### Componentes modernizados

Cabeçalho e navegação, banner, categorias, cards e botões do cardápio, carrinho desktop/mobile, formulários, checkout, modais, mensagens de erro/confirmação, rodapé e estilos compartilhados da gestão. As fotos de pratos existentes foram preservadas e continuam identificadas como ilustrativas.

O painel administrativo autorizado não foi acessado sem credencial: seus estilos compartilhados foram atualizados, mas não se afirma validação operacional de suas ações autorizadas.

## Funcionalidades preservadas e verificadas

Busca com resultado vazio e limpeza; filtro de categoria; abertura de produto; tamanhos P/M/G, acompanhamento, adicional e observação; quantidade e total; entrega/retirada e taxa por zona; preservação de formulário ao fechar/reabrir o checkout; registro fictício no banco local; confirmação, histórico e consulta; remoção do último item; negação de acesso administrativo sem credencial.

Teste monetário de referência mantido: duas marmitas de frango G com ovo, R$60,80; entrega da zona 1, R$8,00; total R$68,80. Aumentar para três unidades resulta em R$99,20 com o mesmo frete. Preços enviados pelo cliente não substituem o cálculo do servidor.

## Testes e resultados

| Verificação | Antes | Depois |
|---|---|---|
| Build de produção | PASS | PASS |
| TypeScript sem emissão | PASS | PASS |
| Lint | 15 erros / 4 avisos | Os mesmos 15 erros / 4 avisos; nenhum novo apontamento |
| Cálculo e entradas inválidas | 14/14 PASS | 14/14 PASS; testes de regressão entregues com Node Test Runner |
| API local: registro, retentativa, conflito, consulta e acessos negados | 9/9 PASS | 9/9 PASS |
| Fluxos de interface / E2E assistido no navegador | 10/10 PASS | 10/10 PASS |
| Animações: padrão, desativação, completas e persistência após reload | Não existia controle | 4/4 PASS |
| Responsividade 320 / 390 / 768 / 1280 px | Sem overflow horizontal | Sem overflow horizontal |

Os dados de teste são fictícios e as escritas ocorreram exclusivamente no D1 local, em `terminal.local`. Nenhum pagamento, pedido de cliente ou mudança de estado em produção foi executado.

As primeiras leituras automatizadas de filtro após a mudança foram prematuras: o React ainda não havia atualizado a tela. Os testes foram sincronizados com o estado visível e repetidos; os três filtros passaram. Também foi detectado e corrigido o crescimento excessivo do banner desktop causado pela imagem intrínseca: o banner final voltou a 391 px na largura de 1280 px.

### Console e acessibilidade

Não foram observados erros da aplicação na amostra final de logs do navegador. Houve erros do script de uma extensão do navegador; eles foram separados dos logs da aplicação. Isso não equivale a ausência universal de erros em todos os ambientes.

Verificados por DOM/CSS e interação: nomes dos botões, labels dos campos, nome estável do carrinho mobile, foco inicial do modal, tamanho de toque dos principais controles, fonte de campos de 16 px no mobile, áreas seguras já existentes, contraste da paleta, desativação das animações e estados `aria-pressed`.

A regra final de `prefers-reduced-motion` desativa transições/animações; a rolagem programática também consulta a preferência do sistema. Não foi emulada a preferência do sistema nem feito teste com TalkBack/VoiceOver, Safari, Android/iOS físicos ou teclado virtual nativo. Não afirmar conformidade completa WCAG com base nesta amostra.

### Artefatos de verificação

- `baseline-*.json`, `baseline-quote.log`: evidência anterior.
- `after-api.json`, `after-ui.json`, `after-motion.json`, `after-responsive.json`: resultados posteriores.
- `unit-results.log`: Node Test Runner, 14 testes sem falhas.
- `before-mobile.jpg`, `after-mobile.jpg`, `after-desktop.jpg`: capturas da prévia local em iframe. São simulações de largura de viewport, não screenshots de aparelhos físicos. Antes/depois mobile mostram a área do catálogo; a captura desktop posterior mostra o catálogo e carrinho.
- Não foi medido Core Web Vitals/Lighthouse, nem é alegado ganho de desempenho. As duas imagens de marca otimizadas totalizam aproximadamente 358 KB. As fotografias existentes mantêm versões menores e carregamento preguiçoso.

## Proteções comprovadas no diff

Sem alterações em `lib/menu.ts`, `app/api/`, `db/`, `drizzle/`, `worker/`, `.openai/`, `app/chatgpt-auth.ts`, `package.json` ou lockfile. Nenhuma dependência adicionada, migração executada, variável de ambiente lida/alterada ou chave de serviço incluída no código.

Os estados e definições dos handlers do componente Home anteriores ao JSX foram comparados com o baseline e permaneceram iguais. As únicas mudanças funcionais da camada de apresentação foram a preferência independente de movimento e o nome acessível do carrinho. As chaves `kika-cart` e `kika-history` foram preservadas.

## Riscos e pendências

1. O lint tem falhas preexistentes; corrigir em tarefa separada para não misturar a modernização com refatoração de hooks e tipos.
2. Cakto/Pix, webhook, envio WhatsApp, cashback, estoque, horários operacionais e cadastro administrativo de produtos ainda não estão implementados. Não foram removidos por esta tarefa.
3. Produtos, preços, regiões, prazos e contato reais da Kika precisam ser cadastrados. Fotos de referência nem sempre correspondem à montagem exata descrita; substituir por fotografias dos pratos reais antes de vender.
4. Validar teclado virtual e barras nativas em Android/iOS reais, leitor de tela, preferências de redução de movimento e sessão administrativa autorizada antes da publicação.
5. Fontes usam Google Fonts com fallback de sistema; medir a experiência real antes de decidir sobre hospedagem local de fontes.
6. O repositório GitHub informado estava vazio. O envio da branch por Git falhou por ausência de autenticação no transporte HTTPS. Os commits e o código foram mantidos localmente e entregues em pacote. Nenhuma branch principal remota foi criada ou alterada.

## Commits e rollback

- `aef692b`: auditoria e baseline antes da modernização.
- `ac98433`: identidade visual, assets e preferências de movimento.
- `c858893`: rolagem visual respeitando a preferência de movimento.
- Commit seguinte: testes de regressão, harness local e esta documentação.

Para desfazer apenas as mudanças visuais na branch:

```bash
git revert c858893 ac98433
```

Não executar `reset --hard`, excluir banco, reverter migrações ou trocar credenciais para um rollback visual. Os commits de auditoria e testes podem permanecer. O pacote contém histórico Git e código-fonte; consulte `ENTREGA.md` na raiz do pacote para restaurar o histórico.

## Reproduzir os checks

Com as dependências existentes instaladas:

```bash
node --experimental-strip-types --test tests/quote-regression.test.mjs
node node_modules/typescript/bin/tsc --noEmit
npm run lint
node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.2/scripts/build-site.mjs
```

O último comando é específico deste ambiente. Fora dele, usar `npm run build` conforme `README.md` e o runtime Worker existente.

O harness de API está em `scripts/qa/local-audit.html`; só funciona em localhost, 127.0.0.1 ou terminal.local. Para auditoria futura, copiá-lo temporariamente para `public/`, executar apenas contra a prévia e D1 locais, e removê-lo depois. Ele não faz parte das páginas publicadas do projeto. Ele registra pedido fictício local; não usar contra bancos de clientes.

## Publicação segura

Revisar o diff da branch e estas limitações; resolver as pendências que afetem a operação pretendida; validar aparelhos reais; autenticar o envio ao GitHub. Somente com autorização explícita posterior fazer merge ou deploy. A aprovação da aparência não ativa pagamentos ou integrações.
