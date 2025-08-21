import React from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button, Card } from '@altamedica/ui';
import Link from 'next/link';
import { 
  Calendar,
  Clock,
  User,
  ArrowRight,
  Tag,
  TrendingUp,
  Heart,
  Brain,
  Shield
} from 'lucide-react';

export const metadata = {
  title: 'Blog - AltaMedica',
  description: 'Artículos sobre salud, tecnología médica y bienestar. Mantente informado con AltaMedica.',
};

// Mock blog posts - in production these would come from a CMS or database
const blogPosts = [
  {
    id: 1,
    title: 'El Futuro de la Telemedicina en Argentina',
    excerpt: 'Exploramos cómo la telemedicina está transformando el acceso a la salud en nuestro país y qué podemos esperar en los próximos años.',
    author: 'Dr. Eduardo Marques',
    date: '2024-01-15',
    readTime: '5 min',
    category: 'Tecnología',
    image: '/images/blog/telemedicine-future.jpg',
    tags: ['Telemedicina', 'Innovación', 'Salud Digital'],
    featured: true
  },
  {
    id: 2,
    title: 'Guía Completa sobre HIPAA y Protección de Datos Médicos',
    excerpt: 'Todo lo que necesitas saber sobre el cumplimiento de HIPAA y cómo protegemos tu información médica en AltaMedica.',
    author: 'Equipo Legal AltaMedica',
    date: '2024-01-10',
    readTime: '8 min',
    category: 'Seguridad',
    image: '/images/blog/hipaa-guide.jpg',
    tags: ['HIPAA', 'Privacidad', 'Seguridad']
  },
  {
    id: 3,
    title: 'Inteligencia Artificial en el Diagnóstico Médico',
    excerpt: 'Cómo la IA está revolucionando la precisión diagnóstica y mejorando los resultados para los pacientes.',
    author: 'Dra. María González',
    date: '2024-01-05',
    readTime: '6 min',
    category: 'IA Médica',
    image: '/images/blog/ai-diagnosis.jpg',
    tags: ['IA', 'Diagnóstico', 'Machine Learning']
  },
  {
    id: 4,
    title: '10 Consejos para Aprovechar al Máximo tu Consulta Virtual',
    excerpt: 'Preparación, tecnología y comunicación: claves para una consulta médica virtual exitosa.',
    author: 'Dr. Carlos Rodríguez',
    date: '2024-01-02',
    readTime: '4 min',
    category: 'Consejos',
    image: '/images/blog/virtual-consultation-tips.jpg',
    tags: ['Consultas', 'Tips', 'Pacientes']
  },
  {
    id: 5,
    title: 'Salud Mental en la Era Digital',
    excerpt: 'La importancia del bienestar mental y cómo la tecnología puede ayudarnos a mantener un equilibrio saludable.',
    author: 'Lic. Ana Martínez',
    date: '2023-12-28',
    readTime: '7 min',
    category: 'Salud Mental',
    image: '/images/blog/mental-health.jpg',
    tags: ['Salud Mental', 'Bienestar', 'Psicología']
  },
  {
    id: 6,
    title: 'WebRTC: La Tecnología detrás de Nuestras Videollamadas HD',
    excerpt: 'Descubre cómo logramos videollamadas médicas de alta calidad con latencia ultra-baja.',
    author: 'Equipo Técnico AltaMedica',
    date: '2023-12-20',
    readTime: '10 min',
    category: 'Tecnología',
    image: '/images/blog/webrtc-tech.jpg',
    tags: ['WebRTC', 'Tecnología', 'Videollamadas']
  }
];

const categories = [
  { name: 'Todos', count: blogPosts.length, icon: TrendingUp },
  { name: 'Tecnología', count: 2, icon: Brain },
  { name: 'Salud Mental', count: 1, icon: Heart },
  { name: 'Seguridad', count: 1, icon: Shield },
  { name: 'IA Médica', count: 1, icon: Brain },
  { name: 'Consejos', count: 1, icon: Heart }
];

export default function BlogPage() {
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Blog de AltaMedica
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Mantente informado sobre las últimas tendencias en salud digital, 
              tecnología médica y bienestar.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Artículo Destacado</h2>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow">
                <div className="md:flex">
                  <div className="md:w-1/2 bg-gradient-to-br from-blue-400 to-purple-600 p-8 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Brain className="w-24 h-24 mx-auto mb-4 opacity-80" />
                      <span className="text-sm uppercase tracking-wide">Artículo Destacado</span>
                    </div>
                  </div>
                  <div className="md:w-1/2 p-8">
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {featuredPost.category}
                      </span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(featuredPost.date).toLocaleDateString('es-AR')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {featuredPost.readTime}
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{featuredPost.title}</h3>
                    <p className="text-gray-600 mb-4">{featuredPost.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <Button className="flex items-center gap-2">
                        Leer más
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-8 px-4 sm:px-6 lg:px-8 border-y border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-4">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <category.icon className="w-4 h-4" />
                  <span>{category.name}</span>
                  <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Últimos Artículos</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.date).toLocaleDateString('es-AR')}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </div>
                      <Link 
                        href={`/blog/${post.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        Leer más
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Cargar más artículos
              </Button>
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Mantente Actualizado
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Suscríbete a nuestro newsletter y recibe las últimas noticias 
              sobre salud digital directamente en tu correo.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Tu correo electrónico"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
              />
              <Button size="lg" variant="secondary">
                Suscribirme
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}