'use client';

import { useDashboardData } from '@/hooks/useDashboardData';
import { Button } from '@altamedica/ui';
import { Briefcase, ChevronRight, FileText, MessageSquare, Send } from 'lucide-react';
import Link from 'next/link';

// Componentes simples
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 border-b border-gray-200 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const Badge = ({ 
  children, 
  variant = "default", 
  className = "" 
}: { 
  children: React.ReactNode; 
  variant?: "default" | "secondary" | "destructive" | "outline"; 
  className?: string;
}) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  const variantClasses = {
    default: "bg-blue-100 text-blue-800",
    secondary: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    outline: "border border-gray-300 text-gray-700"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function MarketplacePage() {
  const { marketplaceOffers } = useDashboardData();

  return (
    <div className="space-y-6">
      {/* Vista previa del marketplace con redirección */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ofertas del Marketplace Médico</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Encuentra las mejores oportunidades profesionales en tu especialidad
              </p>
            </div>
            <Link href="/marketplace">
              <Button>
                <Briefcase className="w-4 h-4 mr-2" />
                Explorar Marketplace
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Resumen de ofertas destacadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Ofertas Totales</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {marketplaceOffers.length}
                  </p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Aplicaciones</p>
                  <p className="text-2xl font-bold text-green-900">3</p>
                </div>
                <Send className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Entrevistas</p>
                  <p className="text-2xl font-bold text-purple-900">1</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Vista previa de las primeras 3 ofertas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Ofertas Destacadas</h3>
            {marketplaceOffers.slice(0, 3).map((offer) => (
              <div key={offer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{offer.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{offer.company} • {offer.location}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span className="text-green-600 font-medium">{offer.salary}</span>
                      <span className="text-gray-500">{offer.type}</span>
                      <span className="text-gray-500">{offer.specialty}</span>
                    </div>
                  </div>
                  {offer.urgent && (
                    <Badge variant="destructive" className="ml-2">
                      Urgente
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t">
            <Link href="/marketplace/applications">
              <Button variant="secondary">
                <FileText className="w-4 h-4 mr-2" />
                Mis Aplicaciones
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button>
                Ver Todas las Ofertas
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}