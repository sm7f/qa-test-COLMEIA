const loginIssues = [
  'Botão "Esqueceu sua senha" não funciona',
  'Ao usuário se logar corretamente, aparece um popup dizendo que o login está incorreto'
];

const databaseIssues = [
  "Botão de lupa da pesquisa não funciona",
  "Quando removemos todos os itens não volta a exibir o aviso de “Nenhum banco de dados encontrado”",
  "Botão de refresh funciona como um f5",
  "Botão para arquivar item está com a mesma função de apagar item",
  "O sistema permite incluir um item em branco"
];

const formsIssues = ["Página em branco"];

describe("Regressão - página Easter Eggs", () => {
  beforeEach(() => {
    cy.viewport(1440, 1200);
    cy.visit("/easter-eggs");
  });

  it("mantém a rota pública com título e introdução visíveis", () => {
    cy.location("pathname").should("eq", "/easter-eggs");
    cy.contains("h1", /^Easter Eggs$/).should("be.visible");
    cy.contains(/parabéns! você encontrou os easter eggs!/i).should("be.visible");
    cy.contains(/lista de easter eggs no site:/i).should("be.visible");
    cy.screenshot("easter-eggs-pagina-publica", { capture: "fullPage" });
  });

  it("lista as categorias e as quantidades esperadas de itens", () => {
    cy.get("main > div > ul > li > b").then(($labels) => {
      const labels = [...$labels].map((element) => element.textContent.trim());
      expect(labels).to.deep.equal(["Login", "Banco de Dados", "Colmeia Forms"]);
    });

    cy.contains("b", "Login").parent("li").find("ul > li").should("have.length", 2);
    cy.contains("b", "Banco de Dados").parent("li").find("ul > li").should("have.length", 5);
    cy.contains("b", "Colmeia Forms").parent("li").find("ul > li").should("have.length", 1);
    cy.screenshot("easter-eggs-categorias-e-contagens", { capture: "fullPage" });
  });

  it("renderiza os textos de defeitos documentados em cada area", () => {
    cy.contains("b", "Login").parent("li").within(() => {
      loginIssues.forEach((issue) => {
        cy.contains("li", issue).should("be.visible");
      });
    });

    cy.contains("b", "Banco de Dados").parent("li").within(() => {
      databaseIssues.forEach((issue) => {
        cy.contains("li", issue).should("be.visible");
      });
    });

    cy.contains("b", "Colmeia Forms").parent("li").within(() => {
      formsIssues.forEach((issue) => {
        cy.contains("li", issue).should("be.visible");
      });
    });
  });
});
