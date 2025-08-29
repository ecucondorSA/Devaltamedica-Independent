'use client';

import React, { useState } from 'react';
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Badge
} from '@altamedica/ui';
import {
  Download,
  FileText,
  Shield,
  Clock,
  ChevronDown,
  Info,
  FileJson,
  FileSpreadsheet,
  Archive,
  Heart,
} from 'lucide-react';
import PatientDataExportModal from './PatientDataExportModal';
import { useToast } from '@altamedica/ui';

interface ExportDataButtonProps {
  patientId: string;
  patientName: string;
  hasActiveExport?: boolean;
  lastExportDate?: Date;
  className?: string;
}

export default function ExportDataButton({
  patientId,
  patientName,
  hasActiveExport = false,
  lastExportDate,
  className = '',
}: ExportDataButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickExportLoading, setQuickExportLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleQuickExport = async (format: 'pdf' | 'json' | 'csv') => {
    setQuickExportLoading(format);
    
    try {
      const response = await fetch('/api/v1/patients/export/quick', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId,
          format,
          scope: 'last-year',
        }),
      });

      if (!response.ok) {
        throw new Error('Error en exportación rápida');
      }

      const data = await response.json();
      
      // Descargar directamente
      window.open(data.downloadUrl, '_blank');
      
      toast({
        title: '✅ Exportación rápida completada',
        description: `Descargando archivo ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: '❌ Error en exportación',
        description: 'No se pudo completar la exportación rápida',
        variant: 'destructive',
      });
    } finally {
      setQuickExportLoading(null);
    }
  };

  const formatLastExportDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <TooltipProvider>
        <div className={`flex items-center gap-2 ${className}`}>
          {/* Botón principal */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Datos</span>
                <span className="sm:hidden">Exportar</span>
                {hasActiveExport && (
                  <Badge variant="secondary" className="ml-2">
                    <Clock className="w-3 h-3 mr-1" />
                    En proceso
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Solicitar copia completa de su información médica</p>
            </TooltipContent>
          </Tooltip>

          {/* Menú de exportación rápida */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                disabled={quickExportLoading !== null}
              >
                {quickExportLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Exportación Rápida
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => handleQuickExport('pdf')}
                disabled={quickExportLoading !== null}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                PDF - Último año
                {quickExportLoading === 'pdf' && (
                  <div className="ml-auto animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => handleQuickExport('json')}
                disabled={quickExportLoading !== null}
                className="flex items-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                JSON - Último año
                {quickExportLoading === 'json' && (
                  <div className="ml-auto animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => handleQuickExport('csv')}
                disabled={quickExportLoading !== null}
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV - Último año
                {quickExportLoading === 'csv' && (
                  <div className="ml-auto animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600" />
                )}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 font-medium"
              >
                <Archive className="w-4 h-4" />
                Exportación Personalizada...
              </DropdownMenuItem>
              
              {lastExportDate && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Info className="w-3 h-3" />
                      <span>Última exportación: {formatLastExportDate(lastExportDate)}</span>
                    </div>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>

      {/* Modal de exportación */}
      <PatientDataExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={patientId}
        patientName={patientName}
      />
    </>
  );
}