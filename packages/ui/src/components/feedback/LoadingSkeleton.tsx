/**
 * 💀 LOADING SKELETON - FEEDBACK COMPONENT
 * Componente genérico para mostrar estado de carga con múltiples variantes
 */

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'table' | 'grid' | 'company';
  count?: number;
  className?: string;
}

// Skeleton básico de card
const CardSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center flex-1">
        <div className="w-16 h-16 bg-slate-200 rounded-xl mr-4"></div>
        <div className="flex-1">
          <div className="h-6 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-24"></div>
        </div>
      </div>
      <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
    </div>

    <div className="space-y-2 mb-4">
      <div className="h-4 bg-slate-200 rounded"></div>
      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      <div className="h-4 bg-slate-200 rounded w-4/6"></div>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-slate-200 rounded mr-3"></div>
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-slate-200 rounded mr-3"></div>
        <div className="h-4 bg-slate-200 rounded w-24"></div>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-slate-200 rounded mr-3"></div>
        <div className="h-4 bg-slate-200 rounded w-28"></div>
      </div>
    </div>

    <div className="flex gap-3">
      <div className="flex-1 h-12 bg-slate-200 rounded-xl"></div>
      <div className="flex-1 h-12 bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

// Skeleton de lista
const ListSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
      </div>
      <div className="w-16 h-8 bg-slate-200 rounded"></div>
    </div>
  </div>
);

// Skeleton de tabla
const TableSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden animate-pulse">
    <div className="px-6 py-4 border-b border-gray-200">
      <div className="h-6 bg-slate-200 rounded w-1/3"></div>
    </div>
    <div className="divide-y divide-gray-200">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="px-6 py-4 flex items-center space-x-4">
          <div className="w-10 h-10 bg-slate-200 rounded"></div>
          <div className="flex-1 h-4 bg-slate-200 rounded"></div>
          <div className="w-20 h-4 bg-slate-200 rounded"></div>
          <div className="w-16 h-4 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

export function LoadingSkeleton({ 
  variant = 'card', 
  count = 6, 
  className = '' 
}: LoadingSkeletonProps) {
  const getSkeletonComponent = () => {
    switch (variant) {
      case 'list':
        return <ListSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'company':
      case 'card':
      default:
        return <CardSkeleton />;
    }
  };

  const getGridClass = () => {
    switch (variant) {
      case 'list':
        return 'space-y-4';
      case 'table':
        return 'space-y-6';
      case 'company':
      case 'card':
      default:
        return 'grid gap-6 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  if (variant === 'table') {
    return (
      <div className={className}>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className={`${getGridClass()} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {getSkeletonComponent()}
        </div>
      ))}
    </div>
  );
}