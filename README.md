# Suite Cypress - Colmeia QA

Suite criada para o teste tecnico descrito em [siteteste.md](./siteteste.md), com estrategia guiada por [agt-cypress.md](./agt-cypress.md) e exploracao controlada do alvo real `https://teste-colmeia-qa.colmeia-corp.com/`.

## Resumo da entrega

O trabalho entregue cobre quatro frentes:

- mapeamento tecnico do alvo real
- definicao de cenarios de teste priorizados
- implementacao da suite Cypress
- documentacao objetiva dos achados encontrados

O alvo inspecionado e um front Angular `21.1.3`, servido como site estatico. Pela analise do HTML e do bundle principal, foram identificadas as rotas:

- `/`
- `/dashboard`
- `/dashboard/campanha/bancos-de-dados`
- `/dashboard/campanha/colmeia-forms`
- `/easter-eggs`

## Achados principais

Falhas reais identificadas no comportamento do site:

1. usuario nao autenticado consegue acessar `/dashboard/campanha/bancos-de-dados`
2. login valido abre um modal com mensagem contraditoria: `Seu login está incorreto, quer continuar?`
3. o modulo `Colmeia Forms` nao apresentou evidencia funcional util no fluxo explorado
4. botao de arquivar chama a mesma acao do botao de apagar
5. item em branco pode ser criado depois de insistir no submit invalido
6. apos remover o ultimo item, o estado vazio nao volta a aparecer
7. rota `/easter-eggs` exposta publicamente lista os bugs da aplicacao

## Estrutura entregue

```txt
cypress/
  component/
    README.md
  e2e/
    integration/
      auth-state.cy.js
    regression/
      critical-flows.cy.js
      known-defects.cy.js
  fixtures/
    site-profile.json
    users.json
  support/
    commands.js
    e2e.js
docs/
  estrategia-e-cenarios.md
```

## Automacao e organizacao

- [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1) prepara o runtime e corrige a execucao do Cypress
- [cypress/support/commands.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/support/commands.js:1) centraliza comandos reutilizaveis
- [cypress/fixtures/users.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/users.json:1) isola massa de teste
- [cypress/fixtures/site-profile.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/site-profile.json:1) isola rotas e seletores
- `integration/` cobre formulario + estado + roteamento
- `regression/critical-flows` cobre o que hoje permanece funcional
- `regression/known-defects` evidencia diferenca entre comportamento esperado e comportamento obtido

## Suites implementadas

### Integracao

Arquivo: [cypress/e2e/integration/auth-state.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/integration/auth-state.cy.js:1)

- validacao de erro no login invalido
- login valido com transicao para dashboard via modal
- acesso direto ao dashboard sem autenticacao

### Regressao critica

Arquivo: [cypress/e2e/regression/critical-flows.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/critical-flows.cy.js:1)

- carga da tela de login
- login valido ate o dashboard
- abertura da area de bancos de dados
- acesso direto a pagina de easter eggs

### Regressao para evidenciar defeitos

Arquivo: [cypress/e2e/regression/known-defects.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/known-defects.cy.js:1)

- bloqueio esperado de rota privada sem login
- login valido sem mensagem incorreta
- renderizacao esperada de `Colmeia Forms`
- arquivamento sem exclusao
- bloqueio de item em branco
- retorno do estado vazio apos exclusao total

Esses cenarios foram escritos para falhar no estado atual da aplicacao, justamente para evidenciar os bugs encontrados.

## Alvo testado

```txt
https://teste-colmeia-qa.colmeia-corp.com/
```

## Linhas de execucao usadas

```bash
./scripts/cypress-local.sh verify
./scripts/cypress-local.sh run --spec 'cypress/e2e/integration/**/*.cy.js'
./scripts/cypress-local.sh run --spec 'cypress/e2e/regression/critical-flows.cy.js'
./scripts/cypress-local.sh run --spec 'cypress/e2e/regression/known-defects.cy.js'
```

Mapeamento do alvo:

```bash
curl -I -L https://teste-colmeia-qa.colmeia-corp.com/
curl -L https://teste-colmeia-qa.colmeia-corp.com/
curl -L https://teste-colmeia-qa.colmeia-corp.com/main-OLCR3OTF.js -o /tmp/colmeia-main.js
rg -n "dashboard|easter-eggs|login|removeItem|qa@test.com|123456" /tmp/colmeia-main.js
```

## Instalar e executar

Foi preparado um runtime local de Node no proprio diretorio para viabilizar a instalacao do Cypress neste ambiente.

```bash
export PATH="$PWD/.tools/node-v24.14.1-linux-x64/bin:$PATH"
npm install
npx cypress open
npm run test:integration
npm run test:regression
npm run test:defects
```

## Resultado da execucao neste ambiente

- `npm install`: executado com sucesso
- `./scripts/cypress-local.sh verify`: executado com sucesso
- `test:integration`: `3/3` passando
- `test:regression`: `4/4` passando
- `test:defects`: `5/6` falhando como evidencia de defeitos e `1/6` passando

Resumo de esperado vs. obtido:

- esperado: rota privada exigir autenticacao; obtido: dashboard abriu sem login
- esperado: login valido concluir sem erro; obtido: modal contraditorio apareceu
- esperado: arquivar preservar item em area arquivada; obtido: estado esperado nao apareceu
- esperado: item em branco ser bloqueado; obtido: linha vazia foi persistida
- esperado: lista vazia reaparecer apos exclusao total; obtido: mensagem nao voltou

### Correcao aplicada no runner

O problema do runner era o ambiente exportando `ELECTRON_RUN_AS_NODE=1`. Isso fazia o binario do Cypress se comportar como Node e rejeitar as flags internas do Electron.

Correcao implementada em [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1):

```sh
export PATH="$PROJECT_ROOT/.tools/node-v24.14.1-linux-x64/bin:$PATH"
export CYPRESS_CACHE_FOLDER="$PROJECT_ROOT/.cache/Cypress"
unset ELECTRON_RUN_AS_NODE
exec "$PROJECT_ROOT/node_modules/.bin/cypress" "$@"
```

Com isso, o runner passou a verificar e executar normalmente em `Electron 138 (headless)`.

## Evidencias tecnicas usadas

- HTML inicial do alvo, que expoe os seletores reais de login
- bundle `main-OLCR3OTF.js`, que expoe rotas, validacoes e handlers
- headers HTTP, que mostram hospedagem estatica
- ausencia de `robots.txt` e `sitemap.xml`
- screenshots de falha geradas em `cypress/screenshots/known-defects.cy.js/`

Detalhamento completo em [docs/estrategia-e-cenarios.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/docs/estrategia-e-cenarios.md:1).
