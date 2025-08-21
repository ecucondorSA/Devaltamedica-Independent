'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Star, ThumbsUp, Calendar, User, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  rating: number;
  comment: string;
  patientName: string;
  createdAt: string;
  helpful: number;
  verified: boolean;
}

const mockReviews: Review[] = [
  {
    id: 'review1',
    rating: 5,
    comment: 'Excelente atención médica. El Dr. García fue muy profesional y el personal muy amable. Las instalaciones están muy bien cuidadas.',
    patientName: 'Juan P.',
    createdAt: '2024-01-10T10:00:00Z',
    helpful: 12,
    verified: true
  },
  {
    id: 'review2',
    rating: 4,
    comment: 'Muy buena experiencia en general. El tiempo de espera fue razonable y el diagnóstico muy acertado. Recomiendo esta institución.',
    patientName: 'María G.',
    createdAt: '2024-01-08T15:30:00Z',
    helpful: 8,
    verified: true
  },
  {
    id: 'review3',
    rating: 5,
    comment: 'Atención excepcional. El personal de enfermería muy atento y las instalaciones modernas. Definitivamente volveré.',
    patientName: 'Carlos M.',
    createdAt: '2024-01-05T09:15:00Z',
    helpful: 15,
    verified: false
  },
  {
    id: 'review4',
    rating: 3,
    comment: 'La atención médica fue buena, aunque el tiempo de espera fue un poco largo. El doctor fue profesional.',
    patientName: 'Ana L.',
    createdAt: '2024-01-03T14:45:00Z',
    helpful: 3,
    verified: true
  }
];

export default function CompanyReviewsPage() {
  const params = useParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [filterRating, setFilterRating] = useState(0);

  const companyInfo = {
    id: '1',
    name: 'Hospital Universitario',
    averageRating: 4.5,
    totalReviews: 150,
    ratingDistribution: {
      5: 85,
      4: 35,
      3: 20,
      2: 7,
      1: 3
    }
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setReviews(mockReviews);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredReviews = reviews
    .filter(review => filterRating === 0 || review.rating === filterRating)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else if (sortBy === 'lowest') {
        return a.rating - b.rating;
      } else if (sortBy === 'helpful') {
        return b.helpful - a.helpful;
      }
      return 0;
    });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPercentage = (count: number, total: number) => {
    return Math.round((count / total) * 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/companies/${params.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a detalles
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reseñas y Opiniones</h1>
          <p className="text-gray-600">{companyInfo.name}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Reviews Summary */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Overall Rating */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {companyInfo.averageRating}
                </div>
                <div className="flex items-center justify-center mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-6 w-6 ${
                        i < Math.floor(companyInfo.averageRating) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <p className="text-gray-600">
                  Basado en {companyInfo.totalReviews} reseñas
                </p>
              </div>

              {/* Rating Distribution */}
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {stars}
                    </span>
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ 
                          width: `${getPercentage(companyInfo.ratingDistribution[stars as keyof typeof companyInfo.ratingDistribution], companyInfo.totalReviews)}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">
                      {companyInfo.ratingDistribution[stars as keyof typeof companyInfo.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="highest">Mejor calificados</option>
                    <option value="lowest">Menor calificados</option>
                    <option value="helpful">Más útiles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filtrar por calificación
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="rating"
                        value={0}
                        checked={filterRating === 0}
                        onChange={() => setFilterRating(0)}
                        className="mr-2"
                      />
                      <span className="text-sm">Todas</span>
                    </label>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <label key={rating} className="flex items-center">
                        <input
                          type="radio"
                          name="rating"
                          value={rating}
                          checked={filterRating === rating}
                          onChange={() => setFilterRating(rating)}
                          className="mr-2"
                        />
                        <div className="flex items-center gap-1">
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                          {[...Array(5 - rating)].map((_, i) => (
                            <Star key={i + rating} className="h-4 w-4 text-gray-300" />
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Reseñas ({filteredReviews.length})
                  </h2>
                  
                  <Link
                    href={`/patient/appointments/apt1/review`}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Escribir reseña
                  </Link>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredReviews.length > 0 ? (
                  <div className="space-y-6">
                    {filteredReviews.map((review) => (
                      <div 
                        key={review.id}
                        data-testid="review-item"
                        className="pb-6 border-b border-gray-200 last:border-b-0"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2">
                                <span data-testid="reviewer-name" className="font-medium text-gray-900">
                                  {review.patientName}
                                </span>
                                {review.verified && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    Verificado
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <div data-testid="review-rating" className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-4 w-4 ${
                                        i < review.rating 
                                          ? 'text-yellow-400 fill-current' 
                                          : 'text-gray-300'
                                      }`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {formatDate(review.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <p data-testid="review-comment" className="text-gray-700 mb-4 leading-relaxed">
                          {review.comment}
                        </p>

                        <div className="flex items-center justify-between">
                          <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <span className="text-sm">
                              Útil ({review.helpful})
                            </span>
                          </button>
                          
                          <button className="text-sm text-gray-500 hover:text-gray-700">
                            Reportar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay reseñas que coincidan
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Ajusta los filtros para ver más reseñas.
                    </p>
                    <button
                      onClick={() => {
                        setFilterRating(0);
                        setSortBy('newest');
                      }}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}