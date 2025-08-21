/// <reference types="cypress" />

describe('Doctors App Authentication', () => {
  const doctorsUrl = Cypress.env('DOCTORS_URL') || 'http://localhost:3003';

  beforeEach(() => {
    // Visitar la página de inicio de sesión de la app de médicos
    cy.visit(doctorsUrl);
    cy.url().should('include', 'localhost:3003');
  });

  it('should allow a doctor to log in with correct credentials', () => {
    // Obtener credenciales de las variables de entorno de Cypress
    const doctorEmail = Cypress.env('DOCTOR_EMAIL');
    const doctorPassword = Cypress.env('DOCTOR_PASSWORD');

    // Asegurarse de que las credenciales existen
    expect(doctorEmail, 'doctor email was set').to.be.a('string');
    expect(doctorPassword, 'doctor password was set').to.be.a('string');

    // Rellenar el formulario de login
    cy.get('[data-cy="email-input"]').should('be.visible').type(doctorEmail);
    cy.get('[data-cy="password-input"]').should('be.visible').type(doctorPassword);

    // Enviar el formulario
    cy.get('[data-cy="login-button"]').should('be.visible').click();

    // Verificar la redirección al dashboard
    cy.url().should('include', '/dashboard');

    // Verificar que el contenido del dashboard es visible
    cy.get('[data-cy="welcome-header"]').should('be.visible').and('contain.text', 'Bienvenido, Dr.');
    cy.get('[data-cy="doctor-dashboard"]').should('be.visible');
    cy.get('[data-cy="appointments-list"]').should('be.visible');
  });

  it('should show an error message with incorrect credentials', () => {
    // Rellenar el formulario con credenciales incorrectas
    cy.get('[data-cy="email-input"]').type('not-a-doctor@email.com');
    cy.get('[data-cy="password-input"]').type('NotTheRightPassword123');

    // Enviar el formulario
    cy.get('[data-cy="login-button"]').click();

    // Verificar que aparece un mensaje de error
    cy.get('[data-cy="error-message"]').should('be.visible').and('contain.text', 'Credenciales incorrectas');

    // Verificar que la URL no ha cambiado
    cy.url().should('not.include', '/dashboard');
  });
});
