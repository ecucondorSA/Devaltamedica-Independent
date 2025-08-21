'use client';

import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@altamedica/ui';
import { useState } from 'react';

export default function SettingsPage() {
  const [companyName, setCompanyName] = useState('Mi Empresa de Salud');
  const [contactEmail, setContactEmail] = useState('contacto@miempresa.com');

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
        <p className="text-lg text-gray-600">Administra la configuración de tu cuenta.</p>
      </header>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input 
                  id="companyName" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email de Contacto</Label>
                <Input 
                  id="contactEmail" 
                  type="email" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)} 
                />
              </div>
              <Button>Guardar Cambios</Button>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline">Cambiar Contraseña</Button>
              <Button variant="destructive">Eliminar Cuenta</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
