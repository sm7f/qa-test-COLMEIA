# Estrategia e Cenarios de Teste

## Insumos analisados

- [agt-cypress.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/agt-cypress.md:1)
- [agt-cybersecurity.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/agt-cybersecurity.md:1)
- [siteteste.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/siteteste.md:1)
- alvo real: `https://teste-colmeia-qa.colmeia-corp.com/`

## Mapeamento tecnico do alvo

Exploracao realizada com:

- `curl` para HTML inicial e headers
- leitura do bundle `main-OLCR3OTF.js`
- enumeracao de rotas client-side presentes no front

### Stack identificada

- Angular `21.1.3`
- front estatico servido por infraestrutura Google Cloud Storage
- pagina inicial com SSR/SSG

### Rotas identificadas

- `/`
- `/dashboard`
- `/dashboard/campanha`
- `/dashboard/campanha/bancos-de-dados`
- `/dashboard/campanha/colmeia-forms`
- `/easter-eggs`

### Elementos e fluxos principais

- login com `#email`, `#password` e botao `Entrar`
- modal exibido apos login valido
- dashboard com menu lateral de campanha
- modulo `Bancos de dados`
- modulo `Colmeia Forms`

### Observacoes de superficie

- `robots.txt` retorna `NoSuchKey`
- `sitemap.xml` retorna `NoSuchKey`
- nao foi identificado consumo claro de API no fluxo principal do front

## Estrategia adotada

### Automacao dos testes

A automacao foi estruturada para separar responsabilidades e reduzir acoplamento entre massa, configuracao e comportamento:

- [cypress.config.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress.config.js:1) fixa o `baseUrl`, o suporte da suite e os timeouts
- [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1) prepara o runtime local e corrige o runner do Cypress
- [cypress/support/commands.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/support/commands.js:1) concentra comandos reutilizaveis como login, selecao de campos e asserts comuns
- [cypress/fixtures/users.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/users.json:1) isola a massa de credenciais
- [cypress/fixtures/site-profile.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/site-profile.json:1) isola rotas, seletores e indicadores textuais

### Organizacao da suite

A organizacao adotada foi:

- `integration/`: cenarios que validam formulario, estado e roteamento do front
- `regression/critical-flows`: fluxos que hoje precisam continuar funcionando
- `regression/known-defects`: cenarios intencionalmente escritos com expectativa de comportamento correto, para evidenciar regressao e defeito
- `component/`: reservado para testes unitarios quando o codigo-fonte dos componentes existir

### Testes unitarios

Nao implementados neste repositorio porque o codigo-fonte original dos componentes nao foi fornecido. O arquivo [cypress/component/README.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/component/README.md:1) documenta o escopo recomendado quando esse material existir.

### Testes de integracao

Arquivo alvo:

- [cypress/e2e/integration/auth-state.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/integration/auth-state.cy.js:1)

Objetivo:

- validar integracao entre formulario, validacoes e roteamento do front

Cenarios:

- login invalido marca campos e mostra erro
- login valido abre modal e so navega apos `Continuar`
- dashboard pode ser acessado diretamente sem login

### Testes de regressao

Arquivos alvo:

- [cypress/e2e/regression/critical-flows.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/critical-flows.cy.js:1)
- [cypress/e2e/regression/known-defects.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/known-defects.cy.js:1)

Objetivos:

- proteger os fluxos minimos que continuam funcionando
- evidenciar defeitos reais que nao deveriam passar despercebidos

## Falhas encontradas

### F-01 Acesso indevido ao dashboard

- Evidencia tecnica: rota `/dashboard/campanha/bancos-de-dados` esta exposta sem qualquer guarda
- Impacto: quebra do controle basico de autenticacao

### F-02 Login valido com mensagem de erro

- Evidencia tecnica: o handler de submit mostra modal com texto `Seu login está incorreto, quer continuar?`
- Impacto: contradicao funcional no principal fluxo do sistema

### F-03 Modulo Colmeia Forms sem evidencia funcional

- Evidencia tecnica: o componente associado no bundle nao possui template funcional
- Observacao: a assert E2E atual nao falhou porque a shell do dashboard continua renderizando header e menu
- Impacto: funcionalidade sem comportamento util identificado na exploracao

### F-04 Arquivar e apagar usam a mesma acao

- Evidencia tecnica: os dois botoes chamam `removeItem`
- Impacto: perda de distinção entre arquivar e excluir

### F-05 Inclusao de item em branco

- Evidencia tecnica: apos insistir no submit invalido, o sistema persiste item vazio
- Impacto: quebra de validacao de dados

### F-06 Estado vazio nao reaparece

- Evidencia tecnica: apos apagar o ultimo item, a mensagem `Nenhum banco de dados encontrado` nao volta
- Impacto: inconsistência de UX e regra visual

### F-07 Rota de easter eggs publica

- Evidencia tecnica: `/easter-eggs` lista bugs internos da aplicacao
- Impacto: exposicao desnecessaria de informacao interna

## Matriz de testes

| ID | Tipo | Funcionalidade | Objetivo | Prioridade | Arquivo Cypress | Status |
|----|------|----------------|----------|------------|-----------------|--------|
| UT-01 | Unitario | Formulario de login | Validar renderizacao, estados e mensagens | Alta | `cypress/component/LoginForm.cy.jsx` | Bloqueado por ausencia do codigo-fonte |
| IT-01 | Integracao | Login invalido | Garantir feedback visual correto no formulario | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| IT-02 | Integracao | Login valido | Validar transicao login -> modal -> dashboard | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| IT-03 | Integracao | Acesso direto ao dashboard | Evidenciar ausencia de protecao de rota | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| RG-01 | Regressao | Tela de login | Garantir carga dos campos criticos | Alta | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-02 | Regressao | Dashboard | Garantir abertura do modulo principal | Alta | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-03 | Regressao | Easter Eggs | Confirmar exposicao da rota publica | Media | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-04 | Regressao | Controle de acesso | Esperar redirecionamento para login sem sessao | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-05 | Regressao | Login sem contradicao | Esperar sucesso limpo no login valido | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-06 | Regressao | Colmeia Forms | Verificar se ha conteudo funcional util no modulo | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-07 | Regressao | Arquivamento | Esperar arquivamento sem exclusao | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-08 | Regressao | Validacao de item | Impedir cadastro em branco | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-09 | Regressao | Estado vazio | Reexibir lista vazia apos exclusao total | Media | `cypress/e2e/regression/known-defects.cy.js` | Implementado |

## Resultado de execucao

### O que funcionou

- instalacao de `cypress@15.14.2`
- download do binario
- configuracao da suite com `baseUrl` real
- `verify` corrigido e aprovado
- integracao `3/3` passando
- regressao critica `4/4` passando
- suite de defeitos executada com `5/6` falhando

## Resultados esperados vs obtidos

### Integracao

| ID | Arquivo | Cenario | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| IT-01 | `auth-state.cy.js` | Login invalido | Campos marcados como invalidos e mensagem de erro visivel | Mensagem `Usuário ou senha inválidos` exibida e campos `email` e `password` marcados como invalidos | Passou |
| IT-02 | `auth-state.cy.js` | Login valido | Navegacao controlada ate o dashboard | Modal intermediario exibido, clique em `Continuar` leva para `/dashboard` | Passou |
| IT-03 | `auth-state.cy.js` | Acesso direto ao dashboard | O sistema atual expor a rota foi tratado como comportamento observavel a ser validado | `/dashboard/campanha/bancos-de-dados` abriu sem autenticacao | Passou |

### Regressao critica

| ID | Arquivo | Cenario | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| RG-01 | `critical-flows.cy.js` | Tela de login | Campos principais renderizados | Tela carregou com email, senha e CTA | Passou |
| RG-02 | `critical-flows.cy.js` | Login valido ate dashboard | Usuario chega ao dashboard apos concluir o fluxo atual | Fluxo atual completou com modal e acesso ao dashboard | Passou |
| RG-03 | `critical-flows.cy.js` | Abertura de Bancos de dados | Modulo principal acessivel | Pagina abriu com busca e botao `Criar` | Passou |
| RG-04 | `critical-flows.cy.js` | Rota Easter Eggs | Rota publica acessivel conforme implementacao atual | Conteudo da pagina foi exibido | Passou |

### Defeitos evidenciados

| ID | Arquivo | Cenario | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| DF-01 | `known-defects.cy.js` | Protecao de rota | Usuario sem sessao deve voltar para `/` | Permaneceu em `/dashboard/campanha/bancos-de-dados` | Falhou |
| DF-02 | `known-defects.cy.js` | Login valido sem erro | Login valido nao deve mostrar mensagem contraditoria | Modal `Seu login está incorreto, quer continuar?` apareceu | Falhou |
| DF-03 | `known-defects.cy.js` | Colmeia Forms com conteudo util | Esperava-se conteudo funcional identificavel | A shell do dashboard continuou renderizando, sem evidenciar falha pela assert atual | Passou |
| DF-04 | `known-defects.cy.js` | Arquivamento | Item arquivado deve aparecer na area arquivada, sem exclusao | Item nao apareceu como arquivado e o estado esperado nao foi encontrado | Falhou |
| DF-05 | `known-defects.cy.js` | Bloqueio de item em branco | Nenhuma linha vazia deve ser persistida | Celula vazia foi encontrada apos insistencia | Falhou |
| DF-06 | `known-defects.cy.js` | Retorno do estado vazio | Mensagem de lista vazia deve reaparecer | Mensagem `Nenhum banco de dados encontrado` nao reapareceu | Falhou |

### Correcao de ambiente

Na primeira execucao, `npx cypress verify` falhou com:

```txt
/Cypress/Cypress: bad option: --no-sandbox
/Cypress/Cypress: bad option: --smoke-test
```

Diagnostico:

- o ambiente estava com `ELECTRON_RUN_AS_NODE=1`
- isso fazia o binario do Cypress rodar em modo Node e rejeitar flags do Electron

Correcao:

- criacao do wrapper [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1)
- `unset ELECTRON_RUN_AS_NODE`
- cache local configurado em `.cache/Cypress`

Conclusao:

- o runner foi corrigido
- a suite passou a executar normalmente
