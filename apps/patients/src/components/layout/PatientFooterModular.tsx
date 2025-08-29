// 🦶 FOOTER MODULAR ALTAMEDICA PACIENTES
// Componente footer independiente con CSS corporativo y funcionalidad completa
// CONSERVADOR: Extrae funcionalidad exacta del layout original, mejora robustez

'use client';

import { Button, Card, Input } from '@altamedica/ui';
import React, { useState, useCallback } from 'react';
import { Heart, Mail, Phone, MapPin, Clock, Shield, ExternalLink } from 'lucide-react';

// 📝 TIPOS ESPECÍFICOS DEL FOOTER
export interface IFooterLink {
  id: string;
  label: string;
  href: string;
  isExternal?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export interface FooterSection {
  title: string;
  links: IFooterLink[];
}

export interface FooterProps {
  className?: string;
  showBrand?: boolean;
  showContactInfo?: boolean;
  customSections?: FooterSection[];
  copyrightText?: string;
  onLinkClick?: (link: IFooterLink) => void;
}

// 🏥 DATOS CORPORATIVOS ALTAMEDICA
const DEFAULT_CONTACT_INFO = {
  phone: '+54 11 4567-8900',
  email: 'soporte@altamedica.com.ar',
  address: 'Av. Corrientes 1234, CABA, Argentina',
  hours: 'Lun-Vie 8:00-20:00, Sáb 9:00-13:00'
};

const DEFAULT_SECTIONS: FooterSection[] = [
  {
    title: 'Portal del Paciente',
    links: [
      { id: 'privacy', label: 'Política de Privacidad', href: '/privacy' },
      { id: 'terms', label: 'Términos y Condiciones', href: '/terms' },
      { id: 'cookies', label: 'Política de Cookies', href: '/cookies' },
      { id: 'data', label: 'Protección de Datos', href: '/data-protection' }
    ]
  },
  {
    title: 'Servicios',
    links: [
      { id: 'appointments', label: 'Agendar Cita', href: '/appointments' },
      { id: 'telemedicine', label: 'Telemedicina', href: '/telemedicine' },
      { id: 'prescriptions', label: 'Prescripciones', href: '/prescriptions' },
      { id: 'health-plans', label: 'Planes de Salud', href: '/health-plans' }
    ]
  },
  {
    title: 'Soporte',
    links: [
      { id: 'help', label: 'Centro de Ayuda', href: '/help' },
      { id: 'contact', label: 'Contacto', href: '/contact' },
      { id: 'faq', label: 'Preguntas Frecuentes', href: '/faq' },
      { id: 'status', label: 'Estado del Sistema', href: '/status', isExternal: true }
    ]
  }
];

// 🔗 COMPONENTE DE ENLACE ROBUSTO
function FooterLink({ link, onLinkClick }: { link: FooterLink; onLinkClick?: (link: FooterLink) => void }) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (link.onClick) {
      e.preventDefault();
      link.onClick();
    }
    onLinkClick?.(link);
  }, [link, onLinkClick]);

  const baseClasses = "text-gray-600 hover:text-primary-altamedica transition-colors duration-200 flex items-center space-x-1 group";

  if (link.onClick || link.isExternal) {
    return (
      <button
        onClick={handleClick}
        className={`${baseClasses} text-left`}
        aria-label={link.label}
      >
        {link.icon && <link.icon className="w-4 h-4" />}
        <span className="group-hover:underline">{link.label}</span>
        {link.isExternal && <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />}
      </button>
    );
  }

  return (
    <a
      href={link.href}
      onClick={handleClick}
      className={baseClasses}
      {...(link.isExternal && { target: '_blank', rel: 'noopener noreferrer' })}
      aria-label={link.label}
    >
      {link.icon && <link.icon className="w-4 h-4" />}
      <span className="group-hover:underline">{link.label}</span>
      {link.isExternal && <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />}
    </a>
  );
}

// 📞 COMPONENTE DE INFORMACIÓN DE CONTACTO
function ContactInfo({ className = "" }: { className?: string }) {
  const [showFullInfo, setShowFullInfo] = useState(false);

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-primary-altamedica uppercase tracking-wider">
        Contacto Altamedica
      </h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <Phone className="w-4 h-4 text-secondary-altamedica" />
          <a 
            href={`tel:${DEFAULT_CONTACT_INFO.phone}`}
            className="hover:text-primary-altamedica transition-colors"
          >
            {DEFAULT_CONTACT_INFO.phone}
          </a>
        </div>
        
        <div className="flex items-center space-x-2 text-gray-600">
          <Mail className="w-4 h-4 text-secondary-altamedica" />
          <a 
            href={`mailto:${DEFAULT_CONTACT_INFO.email}`}
            className="hover:text-primary-altamedica transition-colors"
          >
            {DEFAULT_CONTACT_INFO.email}
          </a>
        </div>
        
        {showFullInfo && (
          <>
            <div className="flex items-start space-x-2 text-gray-600">
              <MapPin className="w-4 h-4 text-secondary-altamedica mt-0.5" />
              <span>{DEFAULT_CONTACT_INFO.address}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock className="w-4 h-4 text-secondary-altamedica" />
              <span>{DEFAULT_CONTACT_INFO.hours}</span>
            </div>
          </>
        )}
        
        <button
          onClick={() => setShowFullInfo(!showFullInfo)}
          className="text-xs text-primary-altamedica hover:text-secondary-altamedica transition-colors underline"
        >
          {showFullInfo ? 'Mostrar menos' : 'Ver más información'}
        </button>
      </div>
    </div>
  );
}

// 🦶 COMPONENTE PRINCIPAL DEL FOOTER
export default function PatientFooterModular({
  className = "",
  showBrand = true,
  showContactInfo = true,
  customSections,
  copyrightText,
  onLinkClick
}: FooterProps) {
  const sections = customSections || DEFAULT_SECTIONS;
  const currentYear = new Date().getFullYear();
  const defaultCopyright = `© ${currentYear} AltaMedica. Todos los derechos reservados.`;
  
  return (
    <footer className={`bg-white border-t border-gray-200 ${className}`}>
      {/* 📊 SECCIÓN PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* 🏥 BRANDING */}
          {showBrand && (
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-primary-altamedica rounded-xl p-2 shadow-lg">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary-altamedica">AltaMedica</h2>
                  <p className="text-sm text-gray-600">Portal del Paciente</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Su salud es nuestra prioridad. Acceda a sus servicios médicos de forma segura y conveniente.
              </p>
              
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-secondary-altamedica" />
                <span className="text-xs text-gray-500">Certificado ISO 27001</span>
              </div>
            </div>
          )}
          
          {/* 📞 INFORMACIÓN DE CONTACTO */}
          {showContactInfo && (
            <ContactInfo className="lg:col-span-1" />
          )}
          
          {/* 🔗 SECCIONES DE ENLACES */}
          {sections.map((section) => (
            <div key={section.title} className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-primary-altamedica uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.id}>
                    <FooterLink link={link} onLinkClick={onLinkClick} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      {/* 📄 BARRA DE COPYRIGHT */}
      <div className="border-t border-gray-200 bg-gradient-primary-altamedica px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-gray-600 mb-2 sm:mb-0">
            {copyrightText || defaultCopyright}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <a 
              href="/privacy" 
              className="hover:text-primary-altamedica transition-colors"
            >
              Privacidad
            </a>
            <a 
              href="/terms" 
              className="hover:text-primary-altamedica transition-colors"
            >
              Términos
            </a>
            <a 
              href="/support" 
              className="hover:text-primary-altamedica transition-colors"
            >
              Soporte
            </a>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-xs">Sistema Operativo</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}