# Documento de Requisitos: Melhorias no Sistema de Relatórios Financeiros

## Introdução

O sistema Vinha Admin Center possui 6 tipos de relatórios em `/admin/relatorios/`. Após análise detalhada do código, todas as 6 APIs existem e estão implementadas, porém apresentam problemas de qualidade, performance e segurança que precisam ser corrigidos. Este documento especifica as melhorias necessárias para tornar o sistema de relatórios robusto, performático e seguro em produção.

## Glossário

- **Report_API**: Endpoint de API REST que gera dados para relatórios administrativos
- **Report_Service**: Camada de serviço que encapsula a lógica de geração de relatórios
- **Pagination**: Mecanismo de divisão de resultados em páginas com limite configurável
- **Cache_Layer**: Camada de cache Redis com TTL de 5 minutos para relatórios
- **Zod_Schema**: Schema de validação de entrada usando a biblioteca Zod
- **Rate_Limiter**: Mecanismo que limita o número de requisições por período
- **Audit_Log**: Registro de auditoria que documenta quem gerou qual relatório e quando
- **SQL_Aggregation**: Cálculos realizados diretamente no banco de dados via SQL em vez de em memória no servidor

## Requisitos

### Requisito 1: Validação de Entrada com Zod

**User Story:** Como administrador, quero que os parâmetros dos relatórios sejam validados antes do processamento, para que o sistema rejeite requisições com dados inválidos e evite erros inesperados.

#### Critérios de Aceitação

1. WHEN uma requisição de relatório é recebida, THE Zod_Schema SHALL validar todos os parâmetros de entrada (datas, filtros, paginação) antes de qualquer processamento
2. WHEN o parâmetro de período contém datas inválidas ou data inicial posterior à data final, THE Zod_Schema SHALL rejeitar a requisição com status 400 e mensagem descritiva em pt-BR
3. WHEN o período solicitado excede 365 dias, THE Zod_Schema SHALL rejeitar a requisição com status 400 informando o limite máximo permitido
4. WHEN parâmetros de paginação são fornecidos com valores fora do intervalo permitido (page < 1 ou limit < 1 ou limit > 100), THE Zod_Schema SHALL rejeitar a requisição com status 400
5. IF um parâmetro de filtro contém um valor não reconhecido (ex: status inexistente), THEN THE Zod_Schema SHALL rejeitar a requisição com status 400 e listar os valores válidos

### Requisito 2: Paginação Server-Side nos Relatórios

**User Story:** Como administrador, quero que relatórios grandes sejam paginados no servidor, para que o sistema não carregue todos os registros em memória e mantenha performance estável.

#### Critérios de Aceitação

1. WHEN o relatório financeiro é solicitado, THE Report_API SHALL aplicar paginação server-side com LIMIT/OFFSET na query SQL, retornando no máximo o número de registros definido pelo parâmetro limit
2. WHEN o relatório de membresia é solicitado, THE Report_API SHALL aplicar paginação server-side com LIMIT/OFFSET na query SQL em vez de carregar todos os membros em memória
3. WHEN o relatório de contribuições é solicitado, THE Report_API SHALL aplicar paginação server-side com LIMIT/OFFSET na query SQL para a lista de contribuintes
4. THE Report_API SHALL retornar metadados de paginação (page, limit, total, totalPages, hasNext, hasPrev) em todas as respostas paginadas
5. WHEN nenhum parâmetro de paginação é fornecido, THE Report_API SHALL usar valores padrão (page=1, limit=20)

### Requisito 3: Otimização de Cálculos para SQL

**User Story:** Como administrador, quero que os cálculos de relatórios sejam feitos no banco de dados, para que o servidor não fique sobrecarregado processando grandes volumes de dados em memória.

#### Critérios de Aceitação

1. WHEN o relatório de inadimplentes calcula dias de atraso, THE Report_API SHALL usar funções SQL de diferença de datas em vez da função getDaysSince() em loop no servidor
2. WHEN o relatório de membresia calcula dados de crescimento mensal, THE Report_API SHALL usar GROUP BY com extração de mês/ano no SQL em vez de filtrar arrays em memória
3. WHEN o relatório geral (route.ts) calcula totais e contagens, THE Report_API SHALL usar funções de agregação SQL (SUM, COUNT) em vez de reduce/filter em arrays carregados em memória

### Requisito 4: Invalidação de Cache ao Criar Transações

**User Story:** Como administrador, quero que os relatórios reflitam dados atualizados após novas transações, para que as informações exibidas sejam confiáveis.

#### Critérios de Aceitação

1. WHEN uma nova transação é criada com status approved, THE Cache_Layer SHALL invalidar todas as chaves de cache de relatórios relacionadas (prefixo `relatorio:*`)
2. WHEN o status de uma transação existente é alterado, THE Cache_Layer SHALL invalidar as chaves de cache de relatórios financeiros e de contribuições
3. WHEN um novo usuário é criado ou seu status é alterado, THE Cache_Layer SHALL invalidar as chaves de cache do relatório de membresia

### Requisito 5: Rate Limiting nos Endpoints de Relatórios

**User Story:** Como administrador do sistema, quero que os endpoints de relatórios tenham rate limiting, para que o sistema fique protegido contra uso excessivo que possa degradar a performance.

#### Critérios de Aceitação

1. THE Rate_Limiter SHALL limitar cada usuário autenticado a no máximo 30 requisições de relatório por minuto
2. WHEN o limite de requisições é excedido, THE Rate_Limiter SHALL retornar status 429 com header Retry-After indicando o tempo de espera em segundos
3. THE Rate_Limiter SHALL usar Redis para armazenar contadores de requisições por usuário, garantindo consistência em ambientes com múltiplas instâncias

### Requisito 6: Logs de Auditoria para Relatórios

**User Story:** Como administrador, quero saber quem gerou cada relatório e quando, para que eu tenha rastreabilidade completa do uso do sistema de relatórios.

#### Critérios de Aceitação

1. WHEN um relatório é gerado com sucesso, THE Audit_Log SHALL registrar o userId, tipo de relatório, filtros aplicados e timestamp na tabela user_action_logs
2. WHEN um relatório é exportado (CSV, PDF ou Excel), THE Audit_Log SHALL registrar o formato de exportação junto com os dados do relatório gerado
3. THE Audit_Log SHALL registrar a ação de forma assíncrona para não impactar o tempo de resposta do relatório

### Requisito 7: Refatoração para Camada de Serviço

**User Story:** Como desenvolvedor, quero que a lógica de relatórios esteja em uma camada de serviço separada das rotas de API, para que o código seja testável e reutilizável.

#### Critérios de Aceitação

1. THE Report_Service SHALL encapsular toda a lógica de consulta e agregação de dados de cada tipo de relatório em funções independentes
2. THE Report_Service SHALL receber parâmetros tipados (interfaces TypeScript) e retornar objetos tipados, sem dependência direta de NextRequest/NextResponse
3. WHEN a Report_API recebe uma requisição válida, THE Report_API SHALL delegar o processamento para o Report_Service correspondente e formatar a resposta HTTP

### Requisito 8: Mensagens de Erro Detalhadas

**User Story:** Como administrador, quero receber mensagens de erro claras e em português quando algo falha nos relatórios, para que eu saiba exatamente o que aconteceu.

#### Critérios de Aceitação

1. WHEN um erro de validação ocorre, THE Report_API SHALL retornar uma mensagem em pt-BR descrevendo qual campo está inválido e qual o formato esperado
2. WHEN um erro interno ocorre, THE Report_API SHALL retornar uma mensagem genérica em pt-BR ao usuário e registrar os detalhes técnicos no log do servidor
3. IF a conexão com o banco de dados falha durante a geração de um relatório, THEN THE Report_API SHALL retornar status 503 com mensagem informando indisponibilidade temporária
