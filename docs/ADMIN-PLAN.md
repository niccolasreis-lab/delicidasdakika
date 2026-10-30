# Painel da Kika — auditoria e plano incremental

## Escopo solicitado

Login exclusivo da responsável e dashboard mobile para cadastrar/editar pratos, descrições, categorias, preços, tamanhos, adicionais e fotografias; escolher pratos do dia e marcar itens esgotados; configurar entrega, retirada, dias e horários de atendimento. As alterações devem aparecer no cardápio sem editar código ou fazer novo deploy.

## Estado auditado

- O catálogo, preços, adicionais e taxas estão fixos em lib/menu.ts.
- A página utiliza esse catálogo diretamente, e a API de pedidos também o utiliza para calcular valores no servidor.
- Existe gestão simples de pedidos protegida por chave de servidor, sem login pessoal por sessão.
- O banco guarda pedidos com itens e valores registrados no momento do pedido.
- O verificador de banco atual recusa tabelas fora do conjunto existente. Novas tabelas exigem migração aditiva explícita e atualização desse verificador.
- A versão publicada não será substituída por uma interface administrativa sem persistência e proteção efetivas.

## Plano seguro

1. Autenticação com biblioteca mantida, sessões em cookies seguros e acesso administrativo restrito à conta da responsável. Não habilitar cadastro público nem armazenar chave administrativa no navegador. Usar o login escolhido pela responsável; configurar a credencial inicial exclusivamente no servidor, sem incluir dados de acesso no código.
2. Migrações aditivas para catálogo, agenda, configurações e autenticação. Preservar tabela de pedidos e dados existentes. Validar primeiro em banco descartável.
3. API pública de catálogo e regras de atendimento; API administrativa autenticada para edição. Reutilizar a interface existente do cardápio e os componentes de formulário.
4. Fazer o checkout consultar preços e disponibilidade no servidor. Pedidos anteriores mantêm seus valores; retentativas idempotentes devem continuar retornando o pedido original mesmo após alterações do catálogo.
5. Upload de imagens pela galeria/câmera do celular, com validação de tipo/tamanho, armazenamento persistente e edição apenas autenticada. Não aceitar envio arbitrário de arquivos executáveis.
6. Dashboard: visão do dia, pratos disponíveis/esgotados, edição de produto, foto, preço e funcionamento. Permitir entrega e retirada, somente entrega, somente retirada ou fechado; agenda semanal e exceção para uma data específica, em horário de São Paulo.
7. Validar autorização em todas as operações, login/logout, sessão expirada, upload, edição refletida no catálogo, preços calculados no servidor, disponibilidade e horários aplicados ao checkout, histórico e idempotência preservados.
8. Apresentar a versão funcional validada antes de migrar dados ou alterar a publicação. Não ativar pagamentos nesta tarefa.

## Informação necessária para a conta inicial

A responsável escolheu acesso por nome de usuário e forneceu a credencial inicial. A senha deve ser convertida em hash pela biblioteca de autenticação e configurada por mecanismo protegido. Não registrar a credencial, telefone ou hash no repositório. Recuperação automática por SMS não faz parte desta versão; a responsável pode trocar a própria senha autenticada.

## Critérios de aceite

A responsável consegue gerenciar o cardápio e o funcionamento pelo celular, sem editar código. Visitantes não conseguem acessar nem alterar dados administrativos. Itens indisponíveis e modalidades/horários desativados são recusados no servidor, mesmo com requisições manipuladas. Pedidos já registrados não mudam de preço. Build, tipos, testes de autenticação, catálogo, agenda e regressão devem passar; limitações e falhas anteriores serão documentadas.

Este arquivo registra o plano inicial da implementação. Consultar o relatório final da funcionalidade para os resultados de teste e publicação.
