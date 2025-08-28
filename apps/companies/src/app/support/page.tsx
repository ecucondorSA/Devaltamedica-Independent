'use client';

import { Button, Input, Textarea, Label } from '@altamedica/ui';
import { LifeBuoy, MessageSquare, Phone } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <header className="mb-8 text-center">
        <LifeBuoy className="mx-auto h-12 w-12 text-blue-600" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900">Centro de Soporte</h1>
        <p className="mt-2 text-lg text-gray-600">¿Necesitas ayuda? Estamos aquí para ti.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-6">Envíanos un mensaje</h2>
            <form className="space-y-6">
              <div>
                <Label htmlFor="name">Tu Nombre</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="email">Tu Email</Label>
                <Input id="email" type="email" placeholder="john.doe@example.com" />
              </div>
              <div>
                <Label htmlFor="subject">Asunto</Label>
                <Input id="subject" placeholder="Ej: Problema con facturación" />
              </div>
              <div>
                <Label htmlFor="message">Mensaje</Label>
                <Textarea id="message" placeholder="Describe tu problema o consulta aquí..." rows={6} />
              </div>
              <Button type="submit" className="w-full">Enviar Mensaje</Button>
            </form>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <Phone className="mx-auto h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Soporte Telefónico</h3>
            <p className="text-gray-600 mb-4">Llámanos para asistencia inmediata.</p>
            <a href="tel:+123456789" className="text-blue-600 font-bold text-lg hover:underline">
              +1 (234) 567-89
            </a>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat en Vivo</h3>
            <p className="text-gray-600 mb-4">Habla con un agente ahora mismo.</p>
            <Button>Iniciar Chat</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
