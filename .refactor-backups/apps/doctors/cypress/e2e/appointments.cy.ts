/// <reference types="cypress" />

describe('Doctors App - Appointments', () => {
  const doctorsUrl = Cypress.env('DOCTORS_URL') || 'http://localhost:3003';

  beforeEach(() => {
    // Realizar login antes de cada prueba de este bloque
    cy.visit(doctorsUrl);
    const doctorEmail = Cypress.env('DOCTOR_EMAIL');
    const doctorPassword = Cypress.env('DOCTOR_PASSWORD');
    cy.get('[data-cy="email-input"]').type(doctorEmail);
    cy.get('[data-cy="password-input"]').type(doctorPassword);
    cy.get('[data-cy="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('should display a list of upcoming appointments', () => {
    // Verificar que el contenedor de la lista de citas existe
    cy.get('[data-cy="appointments-list"]').should('be.visible');

    // Verificar que hay al menos una cita en la lista
    // Esto asume que la base de datos de prueba tiene datos
    cy.get('[data-cy="appointment-item"]').should('have.length.greaterThan', 0);
  });

  it('should allow searching for a specific appointment or patient', () => {
    // Asumimos que hay un paciente de prueba llamado 'Ana Torres'
    const patientNameToSearch = 'Ana Torres';

    // Escribir en el campo de búsqueda
    cy.get('[data-cy="search-appointments-input"]').should('be.visible').type(patientNameToSearch);

    // Verificar que solo las citas del paciente buscado son visibles
    cy.get('[data-cy="appointment-item"]').each(($item) => {
      cy.wrap($item).should('contain.text', patientNameToSearch);
    });

    // Limpiar la búsqueda
    cy.get('[data-cy="search-appointments-input"]').clear();

    // Verificar que la lista vuelve a mostrar todas las citas
    cy.get('[data-cy="appointment-item"]').should('have.length.greaterThan', 1);
  });

  it('should open the details of an appointment when clicked', () => {
    // Hacer clic en el primer elemento de la lista de citas
    cy.get('[data-cy="appointment-item"]').first().click();

    // Verificar que la URL cambia a la vista de detalles de la cita
    cy.url().should('match', /\/appointments\/[a-zA-Z0-9]+$/);

    // Verificar que los elementos de la vista de detalles son visibles
    cy.get('[data-cy="appointment-details-patient-name"]').should('be.visible');
    cy.get('[data-cy="appointment-details-start-telemedicine"]').should('be.visible');
    cy.get('[data-cy="appointment-details-notes"]').should('be.visible');
  });
});
