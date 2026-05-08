# Suíte Cypress - Colmeia QA

Suite criada para o teste técnico descrito em [siteteste.md](./siteteste.md), com estratégia guiada por [agt-cypress.md](./agt-cypress.md) e exploração controlada do alvo real `https://teste-colmeia-qa.colmeia-corp.com/`.

## Resumo da entrega

O trabalho entregue cobre cinco frentes:

- mapeamento técnico do alvo real
- verificação de segurança do fluxo de login e autenticação
- definição de cenários de teste priorizados
- implementação da suíte Cypress
- documentação objetiva dos achados encontrados

O alvo inspecionado é um front Angular `21.1.3`, servido como site estático. Pela análise do HTML e do bundle principal, foram identificadas as rotas:

- `/`
- `/dashboard`
- `/dashboard/campanha/bancos-de-dados`
- `/dashboard/campanha/colmeia-forms`
- `/easter-eggs`

## Achados principais

Falhas reais identificadas no comportamento do site:

1. a autenticação ocorre no cliente, com credenciais expostas no bundle
2. usuário não autenticado consegue acessar `/dashboard/campanha/bancos-de-dados`
3. login válido abre um modal com mensagem contraditória: `Seu login está incorreto, quer continuar?`
4. não foi encontrada evidência de sessão, token ou chamada de autenticação no fluxo inspecionado
5. o módulo `Colmeia Forms` não apresentou evidência funcional útil no fluxo explorado
6. o botão de arquivar chama a mesma ação do botão de apagar
7. item em branco pode ser criado depois de insistir no submit inválido
8. após remover o último item, o estado vazio não volta a aparecer
9. a rota `/easter-eggs` exposta publicamente lista bugs da aplicação

## Segurança de login e autenticação

Os principais achados de segurança do fluxo de autenticação foram:

- o bundle `main-OLCR3OTF.js` contém a comparação direta `qa@test.com` + `123456` no `onSubmit()`
- após o login considerado válido pelo front, o fluxo apenas abre um modal e navega para `/dashboard`
- não foi encontrada evidência de API de autenticação, criação de sessão, token ou cookie de login no caminho analisado
- `curl -I -L` para a rota de dashboard retornou a página estática protegida sem qualquer bloqueio de acesso
- o teste [cypress/e2e/integration/auth-state.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/integration/auth-state.cy.js:1) confirmou abertura direta do dashboard sem autenticação

Em termos práticos, o sistema atual não implementa autenticação real. O “login” é apenas uma validação client-side com navegação local.

Recomendações imediatas:

- mover a autenticação para o backend
- remover credenciais hardcoded do front
- emitir sessão real com controles `HttpOnly`, `Secure` e `SameSite`
- proteger rotas privadas com validação no servidor, não apenas no roteador do front
- retornar `401` ou `403` para recursos privados quando não houver sessão válida
- revisar a política de headers de segurança da entrega pública

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

## Automação e organização

- [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1) prepara o runtime e corrige a execução do Cypress
- [cypress/support/commands.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/support/commands.js:1) centraliza comandos reutilizáveis
- [cypress/fixtures/users.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/users.json:1) isola a massa de teste
- [cypress/fixtures/site-profile.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/site-profile.json:1) isola rotas, seletores e textos de apoio
- `integration/` cobre formulário, estado e roteamento do front
- `regression/critical-flows` cobre o que hoje permanece funcional
- `regression/known-defects` evidencia a diferença entre comportamento esperado e comportamento obtido

## Suítes implementadas

### Integração

Arquivo: [cypress/e2e/integration/auth-state.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/integration/auth-state.cy.js:1)

- validação de erro no login inválido
- login válido com transição para dashboard via modal
- acesso direto ao dashboard sem autenticação

### Regressão crítica

Arquivo: [cypress/e2e/regression/critical-flows.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/critical-flows.cy.js:1)

- carga da tela de login
- login válido até o dashboard
- abertura da área de bancos de dados
- acesso direto à página de easter eggs

### Regressão para evidenciar defeitos

Arquivo: [cypress/e2e/regression/known-defects.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/known-defects.cy.js:1)

- bloqueio esperado de rota privada sem login
- login válido sem mensagem incorreta
- renderização esperada de `Colmeia Forms`
- arquivamento sem exclusão
- bloqueio de item em branco
- retorno do estado vazio após exclusão total

Esses cenários foram escritos para falhar no estado atual da aplicação, justamente para evidenciar os bugs encontrados.

## Alvo testado

```txt
https://teste-colmeia-qa.colmeia-corp.com/
```

## Linhas de execução usadas

```bash
./scripts/cypress-local.sh verify
./scripts/cypress-local.sh run --spec 'cypress/e2e/integration/**/*.cy.js'
./scripts/cypress-local.sh run --spec 'cypress/e2e/regression/critical-flows.cy.js'
./scripts/cypress-local.sh run --spec 'cypress/e2e/regression/known-defects.cy.js'
```

Verificação de segurança do login e da autenticação:

```bash
curl -I -L https://teste-colmeia-qa.colmeia-corp.com/
curl -I -L https://teste-colmeia-qa.colmeia-corp.com/dashboard/campanha/bancos-de-dados
curl -L https://teste-colmeia-qa.colmeia-corp.com/main-OLCR3OTF.js -o /tmp/colmeia-main.js
rg -n "qa@test.com|123456|router.navigate|createAccHandler" /tmp/colmeia-main.js
./scripts/cypress-local.sh run --spec 'cypress/e2e/integration/auth-state.cy.js'
```

## Instalar e executar

Foi preparado um runtime local de Node no próprio diretório para viabilizar a instalação do Cypress neste ambiente.

```bash
export PATH="$PWD/.tools/node-v24.14.1-linux-x64/bin:$PATH"
npm install
npx cypress open
npm run test:integration
npm run test:regression
npm run test:defects
```

## Resultado da execução neste ambiente

- `npm install`: executado com sucesso
- `./scripts/cypress-local.sh verify`: executado com sucesso
- `./scripts/cypress-local.sh run --spec 'cypress/e2e/integration/auth-state.cy.js'`: `3/3` passando
- `test:regression`: `4/4` passando
- `test:defects`: `5/6` falhando como evidência de defeitos e `1/6` passando

Resumo de esperado vs. obtido:

- esperado: autenticação validada no servidor; obtido: comparação local de credenciais no bundle
- esperado: rota privada exigir autenticação; obtido: dashboard abriu sem login
- esperado: login válido concluir sem erro; obtido: modal contraditório apareceu
- esperado: arquivar preservar item em área arquivada; obtido: estado esperado não apareceu
- esperado: item em branco ser bloqueado; obtido: linha vazia foi persistida
- esperado: lista vazia reaparecer após exclusão total; obtido: mensagem não voltou

### Correção aplicada no runner

O problema do runner era o ambiente exportando `ELECTRON_RUN_AS_NODE=1`. Isso fazia o binário do Cypress se comportar como Node e rejeitar as flags internas do Electron.

Correção implementada em [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1):

```sh
export PATH="$PROJECT_ROOT/.tools/node-v24.14.1-linux-x64/bin:$PATH"
export CYPRESS_CACHE_FOLDER="$PROJECT_ROOT/.cache/Cypress"
unset ELECTRON_RUN_AS_NODE
exec "$PROJECT_ROOT/node_modules/.bin/cypress" "$@"
```

Com isso, o runner passou a verificar e executar normalmente em `Electron 138 (headless)`.

## Evidências técnicas usadas

- HTML inicial do alvo, que expõe os seletores reais de login
- bundle `main-OLCR3OTF.js`, que expõe rotas, validações e handlers
- headers HTTP, que mostram hospedagem estática
- ausência de `robots.txt` e `sitemap.xml`
- screenshots de falha geradas em `cypress/screenshots/known-defects.cy.js/`

## Estratégia e cenários detalhados

Esta seção consolida o conteúdo que estava em `docs/estrategia-e-cenarios.md`, para manter o projeto com um ponto único de leitura.

### Insumos analisados

- [agt-cypress.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/agt-cypress.md:1)
- [agt-cybersecurity.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/agt-cybersecurity.md:1)
- [siteteste.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/siteteste.md:1)
- alvo real: `https://teste-colmeia-qa.colmeia-corp.com/`

### Mapeamento técnico do alvo

Exploração realizada com:

- `curl` para HTML inicial e headers
- leitura do bundle `main-OLCR3OTF.js`
- enumeração de rotas client-side presentes no front
- execução de cenários Cypress para validar o comportamento observado

Stack identificada:

- Angular `21.1.3`
- front estático servido por infraestrutura Google Cloud Storage
- página inicial com SSR/SSG

Rotas identificadas:

- `/`
- `/dashboard`
- `/dashboard/campanha`
- `/dashboard/campanha/bancos-de-dados`
- `/dashboard/campanha/colmeia-forms`
- `/easter-eggs`

Elementos e fluxos principais:

- login com `#email`, `#password` e botão `Entrar`
- modal exibido após login válido
- dashboard com menu lateral de campanha
- módulo `Bancos de dados`
- módulo `Colmeia Forms`

Observações de superfície:

- `robots.txt` retorna `NoSuchKey`
- `sitemap.xml` retorna `NoSuchKey`
- não foi identificado consumo claro de API no fluxo principal do front

### Estratégia adotada

Automação dos testes:

- [cypress.config.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress.config.js:1) fixa o `baseUrl`, o suporte da suíte e os timeouts
- [scripts/cypress-local.sh](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/scripts/cypress-local.sh:1) prepara o runtime local e corrige o runner do Cypress
- [cypress/support/commands.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/support/commands.js:1) concentra comandos reutilizáveis, como login, seleção de campos e asserts comuns
- [cypress/fixtures/users.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/users.json:1) isola a massa de credenciais
- [cypress/fixtures/site-profile.json](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/fixtures/site-profile.json:1) isola rotas, seletores e indicadores textuais

Organização da suíte:

- `integration/`: cenários que validam formulário, estado e roteamento do front
- `regression/critical-flows`: fluxos que hoje precisam continuar funcionando
- `regression/known-defects`: cenários intencionalmente escritos com expectativa de comportamento correto, para evidenciar regressão e defeito
- `component/`: reservado para testes unitários quando o código-fonte dos componentes existir

Testes unitários:

- não implementados neste repositório porque o código-fonte original dos componentes não foi fornecido
- o escopo recomendado está em [cypress/component/README.md](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/component/README.md:1)

Testes de integração:

- [cypress/e2e/integration/auth-state.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/integration/auth-state.cy.js:1)
- objetivo: validar a integração entre formulário, validações e roteamento do front
- cenários: login inválido, login válido com modal e acesso direto ao dashboard sem login

Testes de regressão:

- [cypress/e2e/regression/critical-flows.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/critical-flows.cy.js:1)
- [cypress/e2e/regression/known-defects.cy.js](/home/sm7f/Project/Portifolio/Portifolio-Agente/Projetos/qa-test/cypress/e2e/regression/known-defects.cy.js:1)
- objetivos: proteger os fluxos mínimos que continuam funcionando e evidenciar defeitos reais

### Falhas encontradas

#### F-00 Autenticação client-side com credenciais expostas

- evidência técnica: o bundle compara `qa@test.com` e `123456` diretamente no `onSubmit()`
- impacto: qualquer pessoa com acesso ao front publicado consegue descobrir a “regra” de login

#### F-01 Acesso indevido ao dashboard

- evidência técnica: a rota `/dashboard/campanha/bancos-de-dados` está exposta sem qualquer guarda efetiva
- impacto: quebra do controle básico de autenticação

#### F-02 Login válido com mensagem de erro

- evidência técnica: o handler de submit mostra modal com texto `Seu login está incorreto, quer continuar?`
- impacto: contradição funcional no principal fluxo do sistema

#### F-03 Módulo Colmeia Forms sem evidência funcional

- evidência técnica: o componente associado no bundle não possui template funcional
- observação: a assert E2E atual não falhou porque a shell do dashboard continua renderizando header e menu
- impacto: funcionalidade sem comportamento útil identificado na exploração

#### F-04 Arquivar e apagar usam a mesma ação

- evidência técnica: os dois botões chamam `removeItem`
- impacto: perda de distinção entre arquivar e excluir

#### F-05 Inclusão de item em branco

- evidência técnica: após insistir no submit inválido, o sistema persiste item vazio
- impacto: quebra de validação de dados

#### F-06 Estado vazio não reaparece

- evidência técnica: após apagar o último item, a mensagem `Nenhum banco de dados encontrado` não volta
- impacto: inconsistência de UX e regra visual

#### F-07 Rota de easter eggs pública

- evidência técnica: `/easter-eggs` lista bugs internos da aplicação
- impacto: exposição desnecessária de informação interna

### Matriz de testes

| ID | Tipo | Funcionalidade | Objetivo | Prioridade | Arquivo Cypress | Status |
|----|------|----------------|----------|------------|-----------------|--------|
| UT-01 | Unitário | Formulário de login | Validar renderização, estados e mensagens | Alta | `cypress/component/LoginForm.cy.jsx` | Bloqueado por ausência do código-fonte |
| IT-01 | Integração | Login inválido | Garantir feedback visual correto no formulário | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| IT-02 | Integração | Login válido | Validar transição login -> modal -> dashboard | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| IT-03 | Integração | Acesso direto ao dashboard | Evidenciar ausência de proteção de rota | Alta | `cypress/e2e/integration/auth-state.cy.js` | Implementado |
| RG-01 | Regressão | Tela de login | Garantir carga dos campos críticos | Alta | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-02 | Regressão | Dashboard | Garantir abertura do módulo principal | Alta | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-03 | Regressão | Easter Eggs | Confirmar exposição da rota pública | Média | `cypress/e2e/regression/critical-flows.cy.js` | Implementado |
| RG-04 | Regressão | Controle de acesso | Esperar redirecionamento para login sem sessão | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-05 | Regressão | Login sem contradição | Esperar sucesso limpo no login válido | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-06 | Regressão | Colmeia Forms | Verificar se há conteúdo funcional útil no módulo | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-07 | Regressão | Arquivamento | Esperar arquivamento sem exclusão | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-08 | Regressão | Validação de item | Impedir cadastro em branco | Alta | `cypress/e2e/regression/known-defects.cy.js` | Implementado |
| RG-09 | Regressão | Estado vazio | Reexibir lista vazia após exclusão total | Média | `cypress/e2e/regression/known-defects.cy.js` | Implementado |

### Resultados esperados vs. obtidos

#### Integração

| ID | Arquivo | Cenário | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| IT-01 | `auth-state.cy.js` | Login inválido | Campos marcados como inválidos e mensagem de erro visível | Mensagem `Usuário ou senha inválidos` exibida e campos `email` e `password` marcados como inválidos | Passou |
| IT-02 | `auth-state.cy.js` | Login válido | Navegação controlada até o dashboard | Modal intermediário exibido, clique em `Continuar` leva para `/dashboard` | Passou |
| IT-03 | `auth-state.cy.js` | Acesso direto ao dashboard | O sistema atual expor a rota foi tratado como comportamento observável a ser validado | `/dashboard/campanha/bancos-de-dados` abriu sem autenticação | Passou |

#### Regressão crítica

| ID | Arquivo | Cenário | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| RG-01 | `critical-flows.cy.js` | Tela de login | Campos principais renderizados | Tela carregou com email, senha e CTA | Passou |
| RG-02 | `critical-flows.cy.js` | Login válido até dashboard | Usuário chega ao dashboard após concluir o fluxo atual | Fluxo atual completou com modal e acesso ao dashboard | Passou |
| RG-03 | `critical-flows.cy.js` | Abertura de Bancos de dados | Módulo principal acessível | Página abriu com busca e botão `Criar` | Passou |
| RG-04 | `critical-flows.cy.js` | Rota Easter Eggs | Rota pública acessível conforme implementação atual | Conteúdo da página foi exibido | Passou |

#### Defeitos evidenciados

| ID | Arquivo | Cenário | Esperado | Obtido | Resultado |
|----|---------|---------|----------|--------|-----------|
| DF-01 | `known-defects.cy.js` | Proteção de rota | Usuário sem sessão deve voltar para `/` | Permaneceu em `/dashboard/campanha/bancos-de-dados` | Falhou |
| DF-02 | `known-defects.cy.js` | Login válido sem erro | Login válido não deve mostrar mensagem contraditória | Modal `Seu login está incorreto, quer continuar?` apareceu | Falhou |
| DF-03 | `known-defects.cy.js` | Colmeia Forms com conteúdo útil | Esperava-se conteúdo funcional identificável | A shell do dashboard continuou renderizando, sem evidenciar falha pela assert atual | Passou |
| DF-04 | `known-defects.cy.js` | Arquivamento | Item arquivado deve aparecer na área arquivada, sem exclusão | Item não apareceu como arquivado e o estado esperado não foi encontrado | Falhou |
| DF-05 | `known-defects.cy.js` | Bloqueio de item em branco | Nenhuma linha vazia deve ser persistida | Célula vazia foi encontrada após insistência | Falhou |
| DF-06 | `known-defects.cy.js` | Retorno do estado vazio | Mensagem de lista vazia deve reaparecer | Mensagem `Nenhum banco de dados encontrado` não reapareceu | Falhou |
