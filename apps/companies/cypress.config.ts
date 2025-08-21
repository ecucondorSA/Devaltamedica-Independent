import { defineConfig } from 'cypress'

import { logger } from '@altamedica/shared/services/logger.service';
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3005',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    setupNodeEvents(on, config) {
      // Implementar node event listeners aquí
      on('task', {
        log(message) {
          logger.info(message)
          return null
        },
      })
    },
    env: {
      coverage: true,
      codeCoverage: {
        url: 'http://localhost:3000/__coverage__'
      }
    }
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    supportFile: 'cypress/support/component.ts',
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html'
  }
})
