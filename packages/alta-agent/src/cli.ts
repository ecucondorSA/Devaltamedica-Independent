#!/usr/bin/env node

/**
 * CLI Interface for PackageExpertAgent
 * Uso: alta-agent [comando] [argumentos]
 */

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { packageExpert } from './PackageExpertAgent';

import { logger } from '@altamedica/shared/services/logger.service';
program
  .name('alta-agent')
  .description('🤖 Experto en packages de AltaMedica')
  .version('1.0.0');

// Comando: info
program
  .command('info <package>')
  .description('Obtener información sobre un paquete')
  .action((packageName) => {
    if (!packageName.startsWith('@altamedica/')) {
      packageName = `@altamedica/${packageName}`;
    }
    packageExpert.explainUsage(packageName);
  });

// Comando: recommend
program
  .command('recommend <need>')
  .description('Recomendar paquetes basado en necesidad')
  .action((need) => {
    const recommendations = packageExpert.recommendPackages(need);
    if (recommendations.length > 0) {
      logger.info(chalk.green(`\n💡 Recomendaciones para "${need}":\n`));
      recommendations.forEach(rec => {
        logger.info(chalk.cyan(`📦 ${rec.package}`));
        logger.info(`   ${rec.info.purpose}`);
      });
    } else {
      logger.info(chalk.yellow('No se encontraron recomendaciones específicas.'));
    }
  });

// Comando: list
program
  .command('list')
  .description('Listar todos los paquetes disponibles')
  .action(() => {
    packageExpert.listAllPackages();
  });

// Comando: check
program
  .command('check <functionality>')
  .description('Verificar si existe funcionalidad para evitar duplicación')
  .action((functionality) => {
    packageExpert.checkDuplication(functionality);
  });

// Comando: troubleshoot
program
  .command('troubleshoot <problem>')
  .description('Ayuda con problemas comunes')
  .action((problem) => {
    packageExpert.troubleshoot(problem);
  });

// Comando: hierarchy
program
  .command('hierarchy')
  .description('Mostrar jerarquía de dependencias')
  .action(() => {
    packageExpert.showDependencyHierarchy();
  });

// Comando interactivo
program
  .command('interactive')
  .alias('i')
  .description('Modo interactivo')
  .action(async () => {
    logger.info(chalk.blue('\n🤖 ALTA-AGENT - Modo Interactivo\n'));
    
    let continuar = true;
    while (continuar) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '¿Qué necesitas?',
          choices: [
            { name: '📦 Info sobre un paquete', value: 'info' },
            { name: '💡 Recomendación de paquetes', value: 'recommend' },
            { name: '📋 Listar todos los paquetes', value: 'list' },
            { name: '🔍 Verificar duplicación', value: 'check' },
            { name: '🔧 Resolver problema', value: 'troubleshoot' },
            { name: '🏗️ Ver jerarquía', value: 'hierarchy' },
            { name: '❌ Salir', value: 'exit' }
          ]
        }
      ]);

      switch (action) {
        case 'info':
          const { packageName } = await inquirer.prompt([
            {
              type: 'input',
              name: 'packageName',
              message: 'Nombre del paquete (ej: auth, ui, types):',
              filter: (input) => {
                return input.startsWith('@altamedica/') 
                  ? input 
                  : `@altamedica/${input}`;
              }
            }
          ]);
          packageExpert.explainUsage(packageName);
          break;

        case 'recommend':
          const { need } = await inquirer.prompt([
            {
              type: 'input',
              name: 'need',
              message: '¿Qué necesitas hacer? (ej: autenticación, crear formulario, api call):'
            }
          ]);
          const recommendations = packageExpert.recommendPackages(need);
          if (recommendations.length > 0) {
            logger.info(chalk.green(`\n💡 Recomendaciones:\n`));
            recommendations.forEach(rec => {
              logger.info(chalk.cyan(`📦 ${rec.package}`));
              logger.info(`   ${rec.info.purpose}\n`);
            });
          }
          break;

        case 'list':
          packageExpert.listAllPackages();
          break;

        case 'check':
          const { functionality } = await inquirer.prompt([
            {
              type: 'input',
              name: 'functionality',
              message: 'Funcionalidad a verificar (ej: auth, patient management):'
            }
          ]);
          packageExpert.checkDuplication(functionality);
          break;

        case 'troubleshoot':
          const { problem } = await inquirer.prompt([
            {
              type: 'input',
              name: 'problem',
              message: 'Describe el problema:'
            }
          ]);
          packageExpert.troubleshoot(problem);
          break;

        case 'hierarchy':
          packageExpert.showDependencyHierarchy();
          break;

        case 'exit':
          continuar = false;
          logger.info(chalk.green('\n👋 ¡Hasta luego!\n'));
          break;
      }

      if (action !== 'exit') {
        logger.info(''); // Espacio entre acciones
      }
    }
  });

// Comando por defecto (help)
program
  .command('help [query]')
  .description('Mostrar ayuda general o sobre un tema específico')
  .action((query) => {
    packageExpert.help(query);
  });

// Parse arguments
program.parse(process.argv);

// Si no se proporciona comando, mostrar modo interactivo
if (!process.argv.slice(2).length) {
  program.outputHelp();
  logger.info(chalk.yellow('\n💡 Tip: Usa "alta-agent interactive" para modo interactivo\n'));
}