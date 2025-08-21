'use client';

import { cn } from '@altamedica/utils';
import { Stethoscope } from 'lucide-react';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={cn('bg-neutral-900 text-white', 'border-t border-neutral-800', className)}>
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <Stethoscope className="w-8 h-8 text-primary-400 mr-2" />
              <h3 className="text-2xl font-bold text-white">ALTAMEDICA</h3>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              Plataforma integral de gestión sanitaria y telemedicina. Conectando pacientes y
              profesionales de la salud.
            </p>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-neutral-400">Sistema Activo</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Inicio
                </a>
              </li>
              {/* Demo page removida del scope */}
              <li>
                <a
                  href="/servicios"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Servicios
                </a>
              </li>
              <li>
                <a
                  href="/especialistas"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Especialistas
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="/terms"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Términos de Uso
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Política de Privacidad
                </a>
              </li>
              <li>
                <a
                  href="/hipaa"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Cumplimiento HIPAA
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="text-neutral-400 hover:text-primary-400 transition-colors text-sm"
                >
                  Centro de Ayuda
                </a>
              </li>
            </ul>
          </div>

          {/* Contact & Version */}
          <div>
            <h4 className="text-white font-semibold mb-4">Información</h4>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="text-neutral-400">Versión: </span>
                <span className="text-primary-400 font-mono">v1.0.0</span>
              </div>
              <div className="text-sm">
                <span className="text-neutral-400">Build: </span>
                <span className="text-neutral-300 font-mono">2025.01</span>
              </div>
              <div className="text-sm">
                <span className="text-neutral-400">Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Developer Attribution */}
      <div className="border-t border-neutral-800 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-4 text-sm text-neutral-400">
              <span>© {currentYear} ALTAMEDICA</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Todos los derechos reservados</span>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <p className="text-xs text-neutral-500 text-center max-w-4xl mx-auto">
              <strong>Aviso Médico:</strong> Esta plataforma es una herramienta de apoyo para
              profesionales de la salud y no reemplaza el examen fisico médico profesional cuando se
              realiza correctamente. Siempre consulte con un médico certificado para diagnósticos y
              tratamientos. El cumplimiento de normativas HIPAA, protección de datos médicos y su
              dignidad es prioritario.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
