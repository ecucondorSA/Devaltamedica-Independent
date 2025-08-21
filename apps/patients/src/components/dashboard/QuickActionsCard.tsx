// 🏥 COMPONENTE DASHBOARD: QuickActionsCard
// PROACTIVO: <120 líneas, granular, tipado

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'red' | 'yellow' | 'gray';
  onClick: () => void;
  badge?: number;
  disabled?: boolean;
}

interface QuickActionsCardProps {
  title: string;
  actions: QuickAction[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  title,
  actions,
  columns = 2,
  className = ""
}) => {
  const colorClasses = {
    blue: 'text-blue-600 hover:bg-blue-50',
    green: 'text-green-600 hover:bg-green-50',
    purple: 'text-purple-600 hover:bg-purple-50', 
    red: 'text-red-600 hover:bg-red-50',
    yellow: 'text-yellow-600 hover:bg-yellow-50',
    gray: 'text-gray-600 hover:bg-gray-50'
  };

  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      </div>
      
      <div className="p-6">
        <div className={`grid gap-3 ${gridClasses[columns]}`}>
          {actions.map((action) => {
            const Icon = action.icon;
            
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`
                  relative w-full flex items-center p-3 text-left border border-gray-200 
                  rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  ${action.disabled ? '' : colorClasses[action.color]}
                `}
              >
                <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="font-medium flex-1">{action.label}</span>
                
                {action.badge && action.badge > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {action.badge > 99 ? '99+' : action.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuickActionsCard;
