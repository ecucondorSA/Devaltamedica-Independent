/**
 * Network Status Cards Component
 * Extracted from HospitalNetworkDashboard.tsx for better separation of concerns
 */

import { Card, CardContent } from '@altamedica/ui';
import { Building2, AlertTriangle, Activity } from 'lucide-react';

interface NetworkStatusCardsProps {
  networkStatus: {
    healthy: number;
    warning: number;
    critical: number;
    total: number;
  };
  isDarkMode: boolean;
  solarizedColors: any;
  isCompactView: boolean;
}

export const NetworkStatusCards = ({ 
  networkStatus, 
  isDarkMode, 
  solarizedColors, 
  isCompactView 
}: NetworkStatusCardsProps) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${isCompactView ? 'gap-2' : 'gap-4'}`}>
      <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
        isDarkMode 
          ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.green}]/30` 
          : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.green}]/40`
      }`} style={{
        boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.green}20` : `0 4px 20px ${solarizedColors.green}15`
      }}>
        <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                 style={{
                   color: isDarkMode ? solarizedColors.green : solarizedColors.green,
                   fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                   letterSpacing: '0.02em'
                 }}>
                Red Saludable
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300`}
                 style={{
                   color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                   fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                   letterSpacing: '-0.01em'
                 }}>
                {networkStatus.healthy}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                 style={{
                   backgroundColor: isDarkMode ? `${solarizedColors.green}20` : `${solarizedColors.green}15`,
                   boxShadow: `0 0 15px ${solarizedColors.green}40`
                 }}>
              <Activity className={`h-6 w-6 transition-colors duration-300`} 
                       style={{ color: solarizedColors.green }} />
            </div>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
               style={{ 
                 background: `linear-gradient(to right, transparent, ${solarizedColors.green}08)`
               }} />
        </CardContent>
      </Card>

      <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
        isDarkMode 
          ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.yellow}]/30` 
          : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.yellow}]/40`
      }`} style={{
        boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.yellow}20` : `0 4px 20px ${solarizedColors.yellow}15`
      }}>
        <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                 style={{
                   color: isDarkMode ? solarizedColors.yellow : solarizedColors.yellow,
                   fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                   letterSpacing: '0.02em'
                 }}>
                Atención Requerida
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300`}
                 style={{
                   color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                   fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                   letterSpacing: '-0.01em'
                 }}>
                {networkStatus.warning}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                 style={{
                   backgroundColor: isDarkMode ? `${solarizedColors.yellow}20` : `${solarizedColors.yellow}15`,
                   boxShadow: `0 0 15px ${solarizedColors.yellow}40`
                 }}>
              <AlertTriangle className={`h-6 w-6 transition-colors duration-300`} 
                       style={{ color: solarizedColors.yellow }} />
            </div>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
               style={{ 
                 background: `linear-gradient(to right, transparent, ${solarizedColors.yellow}08)`
               }} />
        </CardContent>
      </Card>

      <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
        isDarkMode 
          ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.red}]/30` 
          : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.red}]/40`
      }`} style={{
        boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.red}20` : `0 4px 20px ${solarizedColors.red}15`
      }}>
        <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                 style={{
                   color: isDarkMode ? solarizedColors.red : solarizedColors.red,
                   fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                   letterSpacing: '0.02em'
                 }}>
                Saturación Crítica
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300`}
                 style={{
                   color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                   fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                   letterSpacing: '-0.01em'
                 }}>
                {networkStatus.critical}%
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                 style={{
                   backgroundColor: isDarkMode ? `${solarizedColors.red}20` : `${solarizedColors.red}15`,
                   boxShadow: `0 0 15px ${solarizedColors.red}40`
                 }}>
              <AlertTriangle className={`h-6 w-6 transition-colors duration-300`} 
                           style={{ color: solarizedColors.red }} />
            </div>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
               style={{ 
                 background: `linear-gradient(to right, transparent, ${solarizedColors.red}08)`
               }} />
        </CardContent>
      </Card>

      <Card className={`group hover:scale-105 transform transition-all duration-500 overflow-hidden shadow-lg hover:shadow-xl ${
        isDarkMode 
          ? `bg-gradient-to-br from-[${solarizedColors.base02}] to-[${solarizedColors.base03}] border-[${solarizedColors.blue}]/30` 
          : `bg-gradient-to-br from-[${solarizedColors.base2}] to-[${solarizedColors.base3}] border-[${solarizedColors.blue}]/40`
      }`} style={{
        boxShadow: isDarkMode ? `0 4px 20px ${solarizedColors.blue}20` : `0 4px 20px ${solarizedColors.blue}15`
      }}>
        <CardContent className={`p-4 relative ${isCompactView ? 'p-3' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold tracking-wide transition-colors duration-300`} 
                 style={{
                   color: isDarkMode ? solarizedColors.blue : solarizedColors.blue,
                   fontFamily: '"Inter", "SF Pro Text", system-ui, sans-serif',
                   letterSpacing: '0.02em'
                 }}>
                Hospitales en Red
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300`}
                 style={{
                   color: isDarkMode ? solarizedColors.base1 : solarizedColors.base01,
                   fontFamily: '"JetBrains Mono", "SF Mono", "Monaco", monospace',
                   letterSpacing: '-0.01em'
                 }}>
                {networkStatus.total}
              </p>
            </div>
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`} 
                 style={{
                   backgroundColor: isDarkMode ? `${solarizedColors.blue}20` : `${solarizedColors.blue}15`,
                   boxShadow: `0 0 15px ${solarizedColors.blue}40`
                 }}>
              <Building2 className={`h-6 w-6 transition-colors duration-300`} 
                        style={{ color: solarizedColors.blue }} />
            </div>
          </div>
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent transition-opacity duration-500 opacity-0 group-hover:opacity-100`}
               style={{ 
                 background: `linear-gradient(to right, transparent, ${solarizedColors.blue}08)`
               }} />
        </CardContent>
      </Card>
    </div>
  );
};