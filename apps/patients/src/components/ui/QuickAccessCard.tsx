/**
 * QuickAccessCard.tsx - Tarjeta de Acceso Rápido
 * Proyecto: Altamedica Pacientes
 * Diseño: Componente corporativo para navegación rápida
 */

"use client";

import React from "react";
import { CardCorporate, CardContentCorporate } from "./CardCorporate";
import { ButtonCorporate } from "./ButtonCorporate";

interface QuickAccessCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: "blue" | "green" | "purple" | "orange" | "red" | "teal";
  badge?: string;
  isNew?: boolean;
  onClick?: () => void;
  className?: string;
}

export const QuickAccessCard: React.FC<QuickAccessCardProps> = ({
  title,
  description,
  icon,
  href,
  color,
  badge,
  isNew = false,
  onClick,
  className = "",
}) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300",
    green: "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:border-green-300",
    purple: "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300",
    orange: "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300",
    red: "bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:border-red-300",
    teal: "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200 hover:border-teal-300",
  };

  const iconColors = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100",
    red: "text-red-600 bg-red-100",
    teal: "text-teal-600 bg-teal-100",
  };

  return (
    <CardCorporate 
      variant="default" 
      size="md" 
      className={`transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer ${colorClasses[color]} ${className}`}
      onClick={onClick}
    >
      <CardContentCorporate className="p-6">
        <div className="flex items-start space-x-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${iconColors[color]}`}>
            <div className="w-6 h-6">
              {icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {title}
              </h3>
              {isNew && (
                <span className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
                  Nuevo
                </span>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {description}
            </p>

            {badge && (
              <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full mb-3">
                {badge}
              </span>
            )}

            <ButtonCorporate
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              Acceder →
            </ButtonCorporate>
          </div>
        </div>
      </CardContentCorporate>
    </CardCorporate>
  );
}; 