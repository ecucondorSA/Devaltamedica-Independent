"use client";

import {
  Building,
  MapPin,
  Users,
  Briefcase,
  Star,
  ExternalLink,
  Heart,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface Company {
  id: string;
  name: string;
  industry: string;
  description: string;
  location: string;
  size: string;
  rating?: number;
  jobCount?: number;
  logo?: string;
  website?: string;
}

interface CompanyCardProps {
  company: Company;
  animationDelay?: number;
}

export function CompanyCard({ company, animationDelay = 0 }: CompanyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  return (
    <div
      className="card-default p-6 group cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center flex-1">
          <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl mr-4 flex items-center justify-center shadow-lg">
            {company.logo ? (
              <img
                src={company.logo}
                alt={`Logo de ${company.name}`}
                className="w-10 h-10 object-contain"
              />
            ) : (
              <Building className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-800 mb-1 truncate group-hover:text-sky-600 transition-colors">
              {company.name}
            </h3>
            <p className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full inline-block">
              {company.industry}
            </p>
          </div>
        </div>

        <button
          onClick={handleFavoriteToggle}
          className={`p-2 rounded-full transition-all duration-200 ${
            isFavorite
              ? "text-red-500 bg-red-50 hover:bg-red-100"
              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
          }`}
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Description */}
      <p className="text-slate-600 mb-4 line-clamp-3 leading-relaxed">
        {company.description}
      </p>

      {/* Company Info */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center text-slate-600">
          <MapPin className="w-4 h-4 mr-3 text-slate-400" />
          <span className="text-sm">{company.location}</span>
        </div>
        <div className="flex items-center text-slate-600">
          <Users className="w-4 h-4 mr-3 text-slate-400" />
          <span className="text-sm">{company.size} empleados</span>
        </div>
        {company.jobCount && (
          <div className="flex items-center text-slate-600">
            <Briefcase className="w-4 h-4 mr-3 text-slate-400" />
            <span className="text-sm">{company.jobCount} ofertas activas</span>
          </div>
        )}
        {company.rating && (
          <div className="flex items-center text-slate-600">
            <Star className="w-4 h-4 mr-3 text-amber-400 fill-current" />
            <span className="text-sm font-medium">{company.rating}/5</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href={`/companies/${company.id}`}
          className="flex-1 btn-primary text-center py-3 text-base"
        >
          Ver Perfil
        </Link>
        <Link
          href={`/companies/${company.id}/jobs`}
          className="flex-1 btn-secondary text-center py-3 text-base"
        >
          Ver Ofertas
        </Link>
      </div>

      {/* Website Link */}
      {company.website && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-800 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Visitar Sitio Web
          </a>
        </div>
      )}

      {/* Hover Effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-sky-500/5 to-blue-500/5 rounded-2xl transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
