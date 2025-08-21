/**
 * 🔍 SEARCH FILTER - ALTAMEDICA UI
 * Componente de búsqueda y filtrado para listas médicas
 * Usado por: Patients, Doctors, Companies, Admin Apps
 */

import React from 'react';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

interface SearchFilterProps {
  /** Valor actual de búsqueda */
  searchValue: string;
  /** Callback cuando cambia la búsqueda */
  onSearchChange: (value: string) => void;
  /** Placeholder del campo de búsqueda */
  searchPlaceholder?: string;
  /** Valor actual del filtro */
  filterValue: string;
  /** Callback cuando cambia el filtro */
  onFilterChange: (value: string) => void;
  /** Opciones disponibles para el filtro */
  filterOptions: FilterOption[];
  /** Etiqueta del filtro */
  filterLabel?: string;
  /** Número de resultados encontrados */
  resultCount?: number;
  /** Clase CSS adicional */
  className?: string;
  /** Mostrar contador de resultados */
  showResultCount?: boolean;
  /** Layout del componente */
  layout?: 'horizontal' | 'vertical';
  /** Tamaño del componente */
  size?: 'sm' | 'md' | 'lg';
  /** Tipo de búsqueda médica */
  searchType?: 'patient' | 'doctor' | 'appointment' | 'general';
  /** Callback para limpiar búsqueda */
  onClearSearch?: () => void;
  /** Callback para limpiar filtros */
  onClearFilters?: () => void;
}

/**
 * SearchFilter - Componente de búsqueda y filtrado estandarizado
 * Optimizado para datos médicos con accesibilidad completa
 */
export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Buscar...",
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = "Filtrar por",
  resultCount,
  className = "",
  showResultCount = true,
  layout = 'horizontal',
  size = 'md',
  searchType = 'general',
  onClearSearch,
  onClearFilters
}) => {
  // Configuración de tamaño
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'p-4',
          input: 'py-1.5 px-3 text-sm',
          select: 'py-1.5 px-3 text-sm',
          spacing: 'space-x-2 space-y-2'
        };
      case 'lg':
        return {
          container: 'p-8',
          input: 'py-3 px-4 text-lg',
          select: 'py-3 px-4 text-lg',
          spacing: 'space-x-6 space-y-6'
        };
      default:
        return {
          container: 'p-6',
          input: 'py-2 px-4',
          select: 'py-2 px-4',
          spacing: 'space-x-4 space-y-4'
        };
    }
  };

  // Ícono según tipo de búsqueda médica
  const getSearchIcon = (): string => {
    switch (searchType) {
      case 'patient':
        return '👤';
      case 'doctor':
        return '👨‍⚕️';
      case 'appointment':
        return '📅';
      default:
        return '🔍';
    }
  };

  // Placeholder inteligente según tipo
  const getSmartPlaceholder = (): string => {
    if (searchPlaceholder !== "Buscar...") return searchPlaceholder;
    
    switch (searchType) {
      case 'patient':
        return 'Buscar paciente por nombre o ID...';
      case 'doctor':
        return 'Buscar médico por nombre o especialidad...';
      case 'appointment':
        return 'Buscar cita por fecha o doctor...';
      default:
        return 'Buscar...';
    }
  };

  const sizeClasses = getSizeClasses();

  const containerClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200
    ${sizeClasses.container}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const layoutClasses = layout === 'vertical' 
    ? `flex flex-col ${sizeClasses.spacing.replace('space-x-', 'md:space-x-')}`
    : `flex flex-col md:flex-row md:items-center md:justify-between ${sizeClasses.spacing}`;

  return (
    <div className={containerClasses}>
      <div className={layoutClasses}>
        {/* Controles de búsqueda y filtro */}
        <div className={`flex flex-col sm:flex-row items-stretch sm:items-center ${sizeClasses.spacing}`}>
          {/* Campo de búsqueda */}
          <div className="relative flex-1 min-w-0">
            <span 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lg"
              aria-hidden="true"
            >
              {getSearchIcon()}
            </span>
            <input
              type="text"
              placeholder={getSmartPlaceholder()}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`
                w-full pl-10 pr-10 border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors duration-200
                ${sizeClasses.input}
              `}
              aria-label={`Búsqueda de ${searchType}`}
              autoComplete="off"
            />
            {/* Botón para limpiar búsqueda */}
            {searchValue && onClearSearch && (
              <button
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Limpiar búsqueda"
              >
                ❌
              </button>
            )}
          </div>
          
          {/* Selector de filtro */}
          <div className="relative">
            <select
              value={filterValue}
              onChange={(e) => onFilterChange(e.target.value)}
              className={`
                appearance-none bg-white border border-gray-300 rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors duration-200 pr-10
                ${sizeClasses.select}
                min-w-[150px] sm:min-w-[180px]
              `}
              aria-label={filterLabel}
            >
              {filterOptions.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                  {option.count !== undefined && ` (${option.count})`}
                </option>
              ))}
            </select>
            {/* Ícono de dropdown */}
            <span 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
              aria-hidden="true"
            >
              🔽
            </span>
          </div>

          {/* Botón para limpiar filtros */}
          {onClearFilters && filterValue !== filterOptions[0]?.value && (
            <button
              onClick={onClearFilters}
              className={`
                px-3 border border-gray-300 rounded-lg
                hover:bg-gray-50 transition-colors duration-200
                text-gray-600 hover:text-gray-800
                ${sizeClasses.input}
              `}
              aria-label="Limpiar filtros"
            >
              🗑️ Limpiar
            </button>
          )}
        </div>

        {/* Información de resultados y estado */}
        <div className="flex items-center justify-between">
          {/* Contador de resultados */}
          {showResultCount && resultCount !== undefined && (
            <div className={`
              text-gray-600 flex items-center space-x-2
              ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
            `}>
              <span>📊</span>
              <span>
                <strong>{resultCount}</strong> resultado{resultCount !== 1 ? 's' : ''} 
                {searchValue && ` para "${searchValue}"`}
              </span>
            </div>
          )}

          {/* Estado de búsqueda activa */}
          {(searchValue || filterValue !== filterOptions[0]?.value) && (
            <div className={`
              flex items-center space-x-2 text-blue-600
              ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
            `}>
              <span>🔎</span>
              <span>Filtros activos</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * SearchFilterCompact - Versión compacta para espacios reducidos
 */
export const SearchFilterCompact: React.FC<SearchFilterProps> = (props) => {
  return (
    <SearchFilter
      {...props}
      size="sm"
      layout="vertical"
      showResultCount={false}
      className={`search-filter-compact ${props.className || ''}`}
    />
  );
};

/**
 * SearchFilterExpanded - Versión expandida para dashboards principales
 */
export const SearchFilterExpanded: React.FC<SearchFilterProps> = (props) => {
  return (
    <SearchFilter
      {...props}
      size="lg"
      layout="horizontal"
      showResultCount={true}
      className={`search-filter-expanded ${props.className || ''}`}
    />
  );
};

export default SearchFilter;