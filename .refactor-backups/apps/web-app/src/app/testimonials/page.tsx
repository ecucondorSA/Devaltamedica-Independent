import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card } from '@altamedica/ui';
import { 
  Star,
  Quote,
  Heart,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  TrendingUp
} from 'lucide-react';

export const metadata = {
  title: 'Testimonios - AltaMedica',
  description: 'Conoce las experiencias de nuestros pacientes y profesionales médicos con AltaMedica.',
};

// Mock testimonials - in production these would come from a database
const testimonials = [
  {
    id: 1,
    name: 'María González',
    role: 'Paciente',
    location: 'Buenos Aires',
    date: '2024-01-10',
    rating: 5,
    title: 'Excelente atención y rapidez',
    content: 'La plataforma es increíblemente fácil de usar. Pude conectarme con un especialista en minutos y resolver mi consulta sin salir de casa. La calidad del video fue excelente y el doctor muy profesional.',
    verified: true,
    helpful: 45,
    category: 'patient'
  },
  {
    id: 2,
    name: 'Dr. Carlos Rodríguez',
    role: 'Cardiólogo',
    location: 'Córdoba',
    date: '2024-01-08',
    rating: 5,
    title: 'Herramienta indispensable para mi práctica',
    content: 'AltaMedica ha transformado la forma en que atiendo a mis pacientes. La plataforma es segura, confiable y me permite brindar atención de calidad a pacientes en toda Argentina. El sistema de historiales médicos es excelente.',
    verified: true,
    helpful: 67,
    category: 'doctor'
  },
  {
    id: 3,
    name: 'Laura Martínez',
    role: 'Paciente',
    location: 'Mendoza',
    date: '2024-01-05',
    rating: 5,
    title: 'Salvó mi vida en una emergencia',
    content: 'Tuve una emergencia a las 2 AM y pude conectarme inmediatamente con un médico que me orientó y me derivó correctamente. La rapidez y profesionalismo fueron impecables. Eternamente agradecida.',
    verified: true,
    helpful: 89,
    category: 'patient'
  },
  {
    id: 4,
    name: 'Dr. Ana Fernández',
    role: 'Pediatra',
    location: 'Rosario',
    date: '2023-12-28',
    rating: 5,
    title: 'Perfecta para pediatría',
    content: 'Los padres aprecian mucho poder hacer consultas sin exponer a sus hijos en salas de espera. La plataforma incluye herramientas específicas para pediatría que facilitan mucho mi trabajo.',
    verified: true,
    helpful: 52,
    category: 'doctor'
  },
  {
    id: 5,
    name: 'Roberto Silva',
    role: 'Paciente',
    location: 'La Plata',
    date: '2023-12-20',
    rating: 4,
    title: 'Muy conveniente para seguimientos',
    content: 'Uso AltaMedica para mis controles mensuales de diabetes. Es muchísimo más conveniente que ir al hospital cada vez. Mi doctora puede ver mis análisis y ajustar mi tratamiento rápidamente.',
    verified: true,
    helpful: 34,
    category: 'patient'
  },
  {
    id: 6,
    name: 'Clínica San Rafael',
    role: 'Centro Médico',
    location: 'Neuquén',
    date: '2023-12-15',
    rating: 5,
    title: 'Solución empresarial completa',
    content: 'Implementamos AltaMedica en nuestra clínica hace 6 meses. Ha mejorado significativamente nuestra eficiencia y la satisfacción de los pacientes. El soporte técnico es excepcional.',
    verified: true,
    helpful: 78,
    category: 'company'
  }
];

const stats = [
  { label: 'Calificación Promedio', value: '4.9/5', icon: Star },
  { label: 'Total de Reseñas', value: '10,000+', icon: TrendingUp },
  { label: 'Recomendarían AltaMedica', value: '98%', icon: Heart },
  { label: 'Verificadas', value: '100%', icon: CheckCircle }
];

export default function TestimonialsPage() {
  const patientTestimonials = testimonials.filter(t => t.category === 'patient');
  const doctorTestimonials = testimonials.filter(t => t.category === 'doctor');
  const companyTestimonials = testimonials.filter(t => t.category === 'company');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-1">{renderStars(testimonial.rating)}</div>
        {testimonial.verified && (
          <div className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Verificado</span>
          </div>
        )}
      </div>
      
      <Quote className="w-8 h-8 text-blue-200 mb-2" />
      
      <h3 className="font-semibold text-lg mb-2">{testimonial.title}</h3>
      <p className="text-gray-600 flex-grow mb-4">{testimonial.content}</p>
      
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{testimonial.name}</div>
            <div className="text-sm text-gray-500">{testimonial.role}</div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <MapPin className="w-3 h-3" />
              {testimonial.location}
              <span>•</span>
              <Calendar className="w-3 h-3" />
              {new Date(testimonial.date).toLocaleDateString('es-AR')}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {testimonial.helpful}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Lo que Dicen Nuestros Usuarios
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Miles de pacientes y profesionales médicos confían en AltaMedica 
              para su atención de salud digital.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-b">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Patient Testimonials */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Testimonios de Pacientes
              </h2>
              <p className="text-gray-600">
                Experiencias reales de pacientes que han transformado su atención médica con AltaMedica
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patientTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Doctor Testimonials */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Profesionales Médicos
              </h2>
              <p className="text-gray-600">
                Médicos que han mejorado su práctica con nuestra plataforma
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {doctorTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* Company Testimonials */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Empresas y Clínicas
              </h2>
              <p className="text-gray-600">
                Organizaciones que han digitalizado su atención con AltaMedica
              </p>
            </div>
            <div className="max-w-3xl mx-auto">
              {companyTestimonials.map((testimonial) => (
                <TestimonialCard key={testimonial.id} testimonial={testimonial} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Únete a Miles de Usuarios Satisfechos
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Comienza tu experiencia de salud digital hoy mismo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/auth/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Registrarse Gratis
              </a>
              <a
                href="/contact"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Contactar Ventas
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}