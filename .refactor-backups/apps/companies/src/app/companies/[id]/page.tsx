'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  MapPin, Star, Phone, Globe, Clock, Users, Heart, 
  Shield, Calendar, CheckCircle, AlertCircle, ArrowLeft,
  Stethoscope, Building2, Award, Wifi, Zap
} from 'lucide-react';
import Link from 'next/link';

interface BusinessHours {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
  };
}

interface Company {
  id: string;
  name: string;
  type: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactInfo: {
    phone: string;
    email: string;
    website: string;
  };
  businessHours: BusinessHours;
  specialties: string[];
  services: string[];
  configuration: {
    allowOnlineBooking: boolean;
    allowTelehealth: boolean;
    acceptsInsurance: boolean;
    emergencyServices: boolean;
    requiresAppointment: boolean;
    languages: string[];
  };
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isActive: boolean;
}

const mockCompanyDetails: Company = {
  id: '1',
  name: 'Hospital Universitario',
  type: 'hospital',
  address: {
    street: 'Av. Principal 123',
    city: 'Barcelona',
    state: 'Cataluña',
    zipCode: '08001',
    country: 'España'
  },
  contactInfo: {
    phone: '+34912345678',
    email: 'info@hospital.com',
    website: 'https://hospital.com'
  },
  businessHours: {
    monday: { open: '08:00', close: '20:00', closed: false },
    tuesday: { open: '08:00', close: '20:00', closed: false },
    wednesday: { open: '08:00', close: '20:00', closed: false },
    thursday: { open: '08:00', close: '20:00', closed: false },
    friday: { open: '08:00', close: '20:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true }
  },
  specialties: ['cardiology', 'neurology', 'surgery'],
  services: ['emergency', 'surgery', 'lab'],
  configuration: {
    allowOnlineBooking: true,
    allowTelehealth: true,
    acceptsInsurance: true,
    emergencyServices: true,
    requiresAppointment: false,
    languages: ['es', 'en', 'ca']
  },
  rating: 4.5,
  reviewCount: 150,
  isVerified: true,
  isActive: true
};

const dayNames = {
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo'
};

const specialtyNames = {
  cardiology: 'Cardiología',
  neurology: 'Neurología',
  surgery: 'Cirugía',
  pediatrics: 'Pediatría',
  oncology: 'Oncología'
};

const serviceNames = {
  emergency: 'Emergencias',
  surgery: 'Cirugía',
  lab: 'Laboratorio',
  radiology: 'Radiología',
  pharmacy: 'Farmacia'
};

export default function CompanyDetailsPage() {
  const params = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setCompany(mockCompanyDetails);
      setLoading(false);
    }, 500);
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Institución no encontrada</h2>
          <p className="text-gray-600 mb-4">La institución médica que buscas no está disponible.</p>
          <Link
            href="/companies"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a búsqueda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/companies" className="hover:text-blue-600">Instituciones</Link>
            <span>/</span>
            <span className="text-gray-900">{company.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-sky-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-white">
                    {company.name.charAt(0)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 data-testid="company-name" className="text-2xl font-bold text-gray-900">
                        {company.name}
                      </h1>
                      <p className="text-gray-600">{company.type}</p>
                    </div>
                    
                    {company.isVerified && (
                      <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-md text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Verificado
                      </div>
                    )}
                  </div>
                  
                  <div data-testid="company-rating" className="flex items-center gap-2 mb-4">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-5 w-5 ${
                            i < Math.floor(company.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-900">{company.rating}</span>
                    <span className="text-gray-500">({company.reviewCount} reseñas)</span>
                  </div>
                  
                  <div data-testid="company-address" className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{company.address.street}, {company.address.city}, {company.address.state}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/companies/${company.id}/booking`}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Reservar Cita
                </Link>
                
                <a
                  href={`tel:${company.contactInfo.phone}`}
                  data-testid="company-phone"
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {company.contactInfo.phone}
                </a>
                
                <a
                  href={company.contactInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Sitio web
                </a>
              </div>
            </div>

            {/* Services and Badges */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Servicios y Características</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {company.configuration.allowOnlineBooking && (
                  <div data-testid="online-booking-badge" className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-md">
                    <Calendar className="h-4 w-4" />
                    Reserva Online
                  </div>
                )}
                
                {company.configuration.allowTelehealth && (
                  <div data-testid="telehealth-badge" className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-md">
                    <Wifi className="h-4 w-4" />
                    Telemedicina
                  </div>
                )}
                
                {company.configuration.acceptsInsurance && (
                  <div data-testid="insurance-badge" className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-md">
                    <Shield className="h-4 w-4" />
                    Acepta Seguro
                  </div>
                )}
                
                {company.configuration.emergencyServices && (
                  <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md">
                    <Zap className="h-4 w-4" />
                    Emergencias 24/7
                  </div>
                )}
              </div>
              
              <div data-testid="services-list" className="space-y-2">
                <h3 className="font-medium text-gray-900">Servicios disponibles:</h3>
                <div className="flex flex-wrap gap-2">
                  {company.services.map((service) => (
                    <span 
                      key={service}
                      className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-sm"
                    >
                      {serviceNames[service as keyof typeof serviceNames] || service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Specialties */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Especialidades Médicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {company.specialties.map((specialty) => (
                  <div key={specialty} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      {specialtyNames[specialty as keyof typeof specialtyNames] || specialty}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Hours */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horarios de Atención
              </h3>
              
              <div data-testid="business-hours" className="space-y-2">
                {Object.entries(company.businessHours).map(([day, hours]) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {dayNames[day as keyof typeof dayNames]}
                    </span>
                    <span 
                      data-testid={`hours-${day}`}
                      className={hours.closed ? 'text-red-600' : 'text-gray-900'}
                    >
                      {hours.closed ? 'Cerrado' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Contacto</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span data-testid="company-phone">{company.contactInfo.phone}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span>{company.contactInfo.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Globe className="h-4 w-4 text-gray-500" />
                  <a 
                    href={company.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Sitio web oficial
                  </a>
                </div>
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Idiomas</h3>
              <div className="flex flex-wrap gap-2">
                {company.configuration.languages.map((lang) => (
                  <span 
                    key={lang}
                    className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium"
                  >
                    {lang.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}