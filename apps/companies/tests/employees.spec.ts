import { expect, test } from '@playwright/test';
import { assertions, AuthPage, EmployeePage, testData } from '../helpers/.claude';

test.describe('Gestión de Empleados', () => {
  let authPage: AuthPage;
  let employeePage: EmployeePage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    employeePage = new EmployeePage(page);
    
    await authPage.login();
    await employeePage.goto('/dashboard/employees');
  });

  test('debería mostrar la lista de empleados correctamente', async ({ page }) => {
    await employeePage.assertPageTitle('Empleados');
    await employeePage.assertHeading('Gestión de Empleados');
    
    // Verificar elementos de la interfaz
    await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
    await expect(page.locator('button:has-text("Nuevo Empleado")')).toBeVisible();
    await expect(page.locator('[placeholder*="Buscar empleados"]')).toBeVisible();
    
    // Verificar estadísticas de empleados
    await expect(page.locator('[data-testid="total-employees"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-employees"]')).toBeVisible();
    await expect(page.locator('[data-testid="departments-count"]')).toBeVisible();
  });

  test('debería crear un nuevo empleado exitosamente', async ({ page }) => {
    const employeeData = {
      ...testData.employee,
      email: `test.${Date.now()}@example.com` // Email único
    };

    await employeePage.createEmployee(employeeData);
    
    // Verificar que el empleado aparece en la lista
    await employeePage.searchEmployee(employeeData.firstName);
    await employeePage.assertEmployeeInList(`${employeeData.firstName} ${employeeData.lastName}`);
    
    // Verificar datos del empleado
    await expect(page.locator(`text="${employeeData.email}"`)).toBeVisible();
    await expect(page.locator(`text="${employeeData.position}"`)).toBeVisible();
    await expect(page.locator(`text="${employeeData.department}"`)).toBeVisible();
  });

  test('debería validar campos requeridos al crear empleado', async ({ page }) => {
    await page.click('button:has-text("Nuevo Empleado")');
    await employeePage.waitForModal();
    
    // Intentar enviar formulario vacío
    await page.click('button:has-text("Crear Empleado")');
    
    // Verificar mensajes de validación
    await assertions.assertFormValidation(page, 'firstName', 'El nombre es requerido');
    await assertions.assertFormValidation(page, 'lastName', 'El apellido es requerido');
    await assertions.assertFormValidation(page, 'email', 'El email es requerido');
    await assertions.assertFormValidation(page, 'position', 'El cargo es requerido');
  });

  test('debería editar un empleado existente', async ({ page }) => {
    // Crear empleado primero
    const originalData = {
      ...testData.employee,
      email: `original.${Date.now()}@example.com`
    };
    await employeePage.createEmployee(originalData);
    
    // Editar empleado
    const updatedData = {
      position: 'Senior Developer',
      department: 'Engineering'
    };
    
    await employeePage.editEmployee(`${originalData.firstName} ${originalData.lastName}`, updatedData);
    
    // Verificar cambios
    await employeePage.searchEmployee(originalData.firstName);
    await expect(page.locator(`text="${updatedData.position}"`)).toBeVisible();
    await expect(page.locator(`text="${updatedData.department}"`)).toBeVisible();
  });

  test('debería buscar empleados por diferentes criterios', async ({ page }) => {
    // Crear varios empleados de prueba
    const employees = [
      { ...testData.employee, firstName: 'Ana', lastName: 'García', email: 'ana@test.com', department: 'HR' },
      { ...testData.employee, firstName: 'Luis', lastName: 'Martín', email: 'luis@test.com', department: 'IT' },
      { ...testData.employee, firstName: 'Carmen', lastName: 'López', email: 'carmen@test.com', department: 'Sales' }
    ];

    for (const emp of employees) {
      await employeePage.createEmployee(emp);
    }

    // Buscar por nombre
    await employeePage.searchEmployee('Ana');
    await expect(page.locator('text="Ana García"')).toBeVisible();
    await expect(page.locator('text="Luis Martín"')).not.toBeVisible();

    // Buscar por email
    await page.fill('[placeholder*="Buscar empleados"]', 'luis@test.com');
    await employeePage.waitForPageLoad();
    await expect(page.locator('text="Luis Martín"')).toBeVisible();
    await expect(page.locator('text="Ana García"')).not.toBeVisible();

    // Limpiar búsqueda
    await page.fill('[placeholder*="Buscar empleados"]', '');
    await employeePage.waitForPageLoad();
    await assertions.assertTableHasRows(page, 3);
  });

  test('debería filtrar empleados por departamento', async ({ page }) => {
    // Verificar filtro de departamento
    const departmentFilter = page.locator('[data-testid="department-filter"]');
    if (await departmentFilter.isVisible()) {
      await departmentFilter.selectOption('IT');
      await employeePage.waitForPageLoad();
      
      // Verificar que solo se muestren empleados de IT
      const departmentCells = page.locator('[data-testid="employee-department"]');
      const count = await departmentCells.count();
      
      for (let i = 0; i < count; i++) {
        await expect(departmentCells.nth(i)).toHaveText('IT');
      }
    }
  });

  test('debería ordenar empleados por diferentes columnas', async ({ page }) => {
    // Hacer clic en encabezado de columna para ordenar
    await page.click('th:has-text("Nombre")');
    await employeePage.waitForPageLoad();
    
    // Verificar que la tabla se reordene
    const firstRow = page.locator('tbody tr').first();
    const lastRow = page.locator('tbody tr').last();
    
    const firstName = await firstRow.locator('[data-testid="employee-name"]').textContent();
    const lastName = await lastRow.locator('[data-testid="employee-name"]').textContent();
    
    // Verificar orden alfabético
    expect(firstName!.localeCompare(lastName!)).toBeLessThanOrEqual(0);
  });

  test('debería exportar datos de empleados', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    await page.click('button:has-text("Exportar")');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/empleados.*\.(csv|xlsx)$/);
  });

  test('debería eliminar un empleado con confirmación', async ({ page }) => {
    // Crear empleado para eliminar
    const employeeData = {
      ...testData.employee,
      email: `delete.${Date.now()}@example.com`
    };
    await employeePage.createEmployee(employeeData);
    
    // Eliminar empleado
    await employeePage.deleteEmployee(`${employeeData.firstName} ${employeeData.lastName}`);
    
    // Verificar que el empleado ya no está en la lista
    await employeePage.searchEmployee(employeeData.firstName);
    await expect(page.locator(`text="${employeeData.firstName} ${employeeData.lastName}"`)).not.toBeVisible();
  });

  test('debería manejar estados de carga y error', async ({ page }) => {
    // Simular estado de carga
    await page.route('**/api/employees', async route => {
      await page.waitForTimeout(2000); // Simular latencia
      await route.continue();
    });
    
    await page.reload();
    await assertions.assertLoadingState(page);
    
    // Verificar estado de error
    await page.route('**/api/employees', async route => {
      await route.abort('failed');
    });
    
    await page.reload();
    await expect(page.locator('text="Error al cargar empleados"')).toBeVisible();
  });

  test('debería mostrar detalles del empleado en modal', async ({ page }) => {
    // Crear empleado
    const employeeData = {
      ...testData.employee,
      email: `detail.${Date.now()}@example.com`
    };
    await employeePage.createEmployee(employeeData);
    
    // Ver detalles
    await page.click(`[data-testid="view-employee-${employeeData.firstName}"]`);
    await employeePage.waitForModal();
    
    // Verificar información en el modal
    await expect(page.locator(`text="${employeeData.firstName} ${employeeData.lastName}"`)).toBeVisible();
    await expect(page.locator(`text="${employeeData.email}"`)).toBeVisible();
    await expect(page.locator(`text="${employeeData.position}"`)).toBeVisible();
    await expect(page.locator(`text="${employeeData.department}"`)).toBeVisible();
  });

  test('debería validar formato de email', async ({ page }) => {
    await page.click('button:has-text("Nuevo Empleado")');
    await employeePage.waitForModal();
    
    // Ingresar email inválido
    await page.fill('[name="email"]', 'email-invalido');
    await page.click('button:has-text("Crear Empleado")');
    
    await expect(page.locator('text="Email inválido"')).toBeVisible();
  });

  test('debería manejar empleados duplicados', async ({ page }) => {
    const employeeData = {
      ...testData.employee,
      email: `duplicate.${Date.now()}@example.com`
    };
    
    // Crear primer empleado
    await employeePage.createEmployee(employeeData);
    
    // Intentar crear empleado duplicado
    await page.click('button:has-text("Nuevo Empleado")');
    await employeePage.waitForModal();
    await employeePage.fillForm(employeeData);
    await page.click('button:has-text("Crear Empleado")');
    
    await expect(page.locator('text="Email ya está en uso"')).toBeVisible();
  });

  test('debería funcionar correctamente en modo responsive', async ({ page }) => {
    // Cambiar a vista móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verificar que la tabla se adapte o cambie a vista de cards
    const isMobile = await page.locator('[data-testid="mobile-employee-list"]').isVisible();
    
    if (isMobile) {
      // Verificar vista de cards en móvil
      await expect(page.locator('[data-testid="employee-card"]')).toHaveCountGreaterThan(0);
    } else {
      // Verificar que la tabla horizontal tenga scroll
      await expect(page.locator('[data-testid="employee-table"]')).toBeVisible();
    }
  });
});
