'use client';

import React, { useState } from 'react';
import { Button } from '@altamedica/ui';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { 
  Heart, 
  Brain, 
  Eye, 
  Bone,
  Baby,
  Activity,
  Stethoscope,
  Star,
  MapPin,
  Clock,
  Video,
  CheckCircle,
  Search,
  Filter
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const specialties = [
  { 
    icon: Heart, 
    name: "Cardiología",
    count: 87,
    description: "Especialistas en enfermedades cardiovasculares",
    color: "text-red-500"
  },
  { 
    icon: Brain, 
    name: "Neurología",
    count: 52,
    description: "Expertos en sistema nervioso y trastornos neurológicos",
    color: "text-purple-500"
  },
  { 
    icon: Eye, 
    name: "Oftalmología",
    count: 43,
    description: "Cuidado integral de la salud visual",
    color: "text-blue-500"
  },
  { 
    icon: Bone, 
    name: "Traumatología",
    count: 65,
    description: "Tratamiento de lesiones y trastornos del sistema músculo-esquelético",
    color: "text-amber-500"
  },
  { 
    icon: Baby, 
    name: "Pediatría",
    count: 78,
    description: "Atención médica especializada para niños y adolescentes",
    color: "text-pink-500"
  },
  { 
    icon: Activity, 
    name: "Medicina Interna",
    count: 95,
    description: "Diagnóstico y tratamiento de enfermedades en adultos",
    color: "text-green-500"
  }
];

const featuredDoctors = [
  {
    id: 1,
    name: "Dr. Carlos Mendoza",
    specialty: "Cardiología",
    image: "/api/placeholder/150/150",
    rating: 4.9,
    reviews: 156,
    experience: "15 años",
    location: "CABA, Buenos Aires",
    languages: ["Español", "Inglés"],
    telemedicine: true,
    nextAvailable: "Hoy 16:00",
    education: "Universidad de Buenos Aires",
    certifications: ["Cardiólogo Intervencionista", "Especialista en Ecocardiografía"]
  },
  {
    id: 2,
    name: "Dra. María Elena Rodríguez",
    specialty: "Neurología",
    image: "/api/placeholder/150/150",
    rating: 4.8,
    reviews: 203,
    experience: "12 años",
    location: "Rosario, Santa Fe",
    languages: ["Español", "Portugués"],
    telemedicine: true,
    nextAvailable: "Mañana 09:30",
    education: "Universidad Nacional de Córdoba",
    certifications: ["Neurofisiología Clínica", "Especialista en Epilepsia"]
  },
  {
    id: 3,
    name: "Dr. Juan Pablo Fernández",
    specialty: "Pediatría",
    image: "/api/placeholder/150/150",
    rating: 4.9,
    reviews: 324,
    experience: "18 años",
    location: "Córdoba, Córdoba",
    languages: ["Español", "Inglés", "Italiano"],
    telemedicine: true,
    nextAvailable: "Hoy 14:30",
    education: "Universidad Católica de Córdoba",
    certifications: ["Neonatología", "Pediatría del Desarrollo"]
  }
];

export default function EspecialistasPage() {
  const router = useRouter();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleLogin = () => router.push('/login');
  const handleRegister = () => router.push('/register');

  const filteredDoctors = featuredDoctors.filter(doctor => {
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    const matchesSearch = !searchTerm || doctor.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <Header onLogin={handleLogin} onRegister={handleRegister} />
      
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-primary-50 to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-display font-bold text-neutral-900 mb-4">
            Nuestros Especialistas
          </h1>
          <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
            Conecta con más de 1,200+ médicos especialistas verificados. 
            Encuentra al profesional ideal para tus necesidades de salud.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nombre de médico o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specialties Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
              Especialidades Disponibles
            </h2>
            <p className="text-lg text-neutral-600">
              Encuentra especialistas en todas las áreas médicas
            </p>
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
            {specialties.map((specialty, index) => {
              const Icon = specialty.icon;
              return (
                <div 
                  key={index}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === specialty.name ? '' : specialty.name)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg ${
                    selectedSpecialty === specialty.name 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-lg ${specialty.color.replace('text-', 'bg-').replace('500', '100')} flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${specialty.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-neutral-900">
                        {specialty.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mt-1">
                        {specialty.description}
                      </p>
                      <p className="text-primary-500 text-sm font-medium mt-2">
                        {specialty.count} especialistas disponibles
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-neutral-900 mb-2">
                Especialistas Destacados
              </h2>
              <p className="text-lg text-neutral-600">
                {selectedSpecialty ? `Especialistas en ${selectedSpecialty}` : 'Los mejores profesionales en nuestra plataforma'}
              </p>
            </div>
            
            {selectedSpecialty && (
              <Button 
                variant="outline" 
                onClick={() => setSelectedSpecialty('')}
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpiar Filtro
              </Button>
            )}
          </div>

          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-8 h-8 text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-semibold text-lg text-neutral-900">
                        {doctor.name}
                      </h3>
                      <p className="text-primary-500 font-medium">
                        {doctor.specialty}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="text-sm font-medium text-neutral-700 ml-1">
                            {doctor.rating}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-500">
                          ({doctor.reviews} reseñas)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-neutral-600">
                      <Clock className="w-4 h-4 mr-2 text-neutral-400" />
                      {doctor.experience} de experiencia
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
                      {doctor.location}
                    </div>
                    <div className="flex items-center text-sm text-neutral-600">
                      <Video className="w-4 h-4 mr-2 text-neutral-400" />
                      <span className="flex items-center">
                        Telemedicina disponible
                        <CheckCircle className="w-4 h-4 ml-1 text-success-500" />
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-4">
                    <p className="text-sm text-neutral-600 mb-2">
                      <strong>Próxima cita:</strong> {doctor.nextAvailable}
                    </p>
                    <p className="text-sm text-neutral-600 mb-4">
                      <strong>Idiomas:</strong> {doctor.languages.join(', ')}
                    </p>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" className="flex-1">
                        Agendar Cita
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredDoctors.length === 0 && (
            <div className="text-center py-12">
              <Stethoscope className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                No se encontraron especialistas
              </h3>
              <p className="text-neutral-600">
                Prueba ajustar tus filtros de búsqueda o explora otras especialidades.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Our Specialists */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-neutral-900 mb-4">
              ¿Por qué elegir nuestros especialistas?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                100% Verificados
              </h3>
              <p className="text-neutral-600">
                Todos nuestros médicos han pasado por un riguroso proceso de verificación de credenciales y experiencia.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Telemedicina Avanzada
              </h3>
              <p className="text-neutral-600">
                Consultas por videollamada con tecnología de punta y herramientas diagnósticas integradas.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">
                Alta Calificación
              </h3>
              <p className="text-neutral-600">
                Promedio de 4.7/5 estrellas basado en más de 15,000 reseñas de pacientes reales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            ¿Listo para encontrar tu especialista ideal?
          </h2>
          <p className="text-lg mb-8 text-primary-100">
            Regístrate hoy y accede a nuestra red de especialistas médicos verificados.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="min-w-[200px]">
                Registrarse Gratis
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="min-w-[200px] bg-white/10 text-white border-white hover:bg-white hover:text-primary-500">
                Contactar Soporte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Metadata must be exported from a separate server component file
// or defined in layout.tsx for this route