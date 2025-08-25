'use client';

import React, { useEffect, useState } from 'react';

import { logger } from '@altamedica/shared/services/logger.service';
interface MedicalDocument {
  id: string;
  title: string;
  type: 'prescription' | 'lab_report' | 'imaging' | 'medical_record' | 'consent' | 'other';
  category: string;
  date: Date;
  size: number; // en bytes
  format: 'pdf' | 'jpg' | 'png' | 'doc' | 'docx';
  uploadedBy: string;
  isConfidential: boolean;
  tags: string[];
  description?: string;
}

interface MedicalDocumentsProps {
  patientId: string;
  compact?: boolean;
  allowUpload?: boolean;
  onDocumentClick?: (document: MedicalDocument) => void;
  onDownload?: (documentId: string) => void;
  onDelete?: (documentId: string) => void;
}

const MedicalDocuments: React.FC<MedicalDocumentsProps> = ({
  patientId,
  compact = false,
  allowUpload = false,
  onDocumentClick,
  onDownload,
  onDelete,
}) => {
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [showConfidential, setShowConfidential] = useState(false);

  // Cargar documentos
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setIsLoading(true);

        // Simular carga de datos
        const mockDocuments: MedicalDocument[] = [
          {
            id: '1',
            title: 'Receta Médica - Metformina',
            type: 'prescription',
            category: 'Medicamentos',
            date: new Date(Date.now() - 7 * 24 * 3600000),
            size: 245760, // 240KB
            format: 'pdf',
            uploadedBy: 'Dr. María García',
            isConfidential: false,
            tags: ['diabetes', 'metformina', 'receta'],
            description: 'Receta para Metformina 850mg, 2 veces al día',
          },
          {
            id: '2',
            title: 'Análisis de Sangre Completo',
            type: 'lab_report',
            category: 'Laboratorio',
            date: new Date(Date.now() - 3 * 24 * 3600000),
            size: 1024000, // 1MB
            format: 'pdf',
            uploadedBy: 'Laboratorio Central',
            isConfidential: true,
            tags: ['sangre', 'glucosa', 'colesterol'],
            description:
              'Resultados de análisis de sangre incluyendo glucosa, colesterol y triglicéridos',
          },
          {
            id: '3',
            title: 'Radiografía de Tórax',
            type: 'imaging',
            category: 'Imágenes',
            date: new Date(Date.now() - 14 * 24 * 3600000),
            size: 5120000, // 5MB
            format: 'jpg',
            uploadedBy: 'Dr. Carlos López',
            isConfidential: true,
            tags: ['radiografía', 'tórax', 'pulmones'],
            description: 'Radiografía de tórax en proyección PA y lateral',
          },
          {
            id: '4',
            title: 'Consentimiento Informado - Cirugía',
            type: 'consent',
            category: 'Administrativo',
            date: new Date(Date.now() - 30 * 24 * 3600000),
            size: 153600, // 150KB
            format: 'pdf',
            uploadedBy: 'Enf. Ana Martínez',
            isConfidential: false,
            tags: ['consentimiento', 'cirugía', 'procedimiento'],
            description: 'Consentimiento informado para procedimiento quirúrgico',
          },
          {
            id: '5',
            title: 'Historial Médico Completo',
            type: 'medical_record',
            category: 'Expediente',
            date: new Date(Date.now() - 60 * 24 * 3600000),
            size: 2048000, // 2MB
            format: 'pdf',
            uploadedBy: 'Dr. María García',
            isConfidential: true,
            tags: ['historial', 'expediente', 'resumen'],
            description: 'Resumen completo del historial médico del paciente',
          },
        ];

        setDocuments(mockDocuments);
      } catch (error) {
        logger.error('Error cargando documentos:', error as string);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [patientId]);

  // Filtrar y ordenar documentos
  const filteredDocuments = documents
    .filter((doc) => {
      // Filtrar por categoría
      if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;

      // Filtrar por búsqueda
      if (
        searchTerm &&
        !doc.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ) {
        return false;
      }

      // Filtrar documentos confidenciales
      if (doc.isConfidential && !showConfidential) return false;

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'size':
          return b.size - a.size;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

  // Obtener categorías únicas
  const categories = Array.from(new Set(documents.map((doc) => doc.category)));

  // Obtener icono según tipo de documento
  const getDocumentIcon = (
    type: 'prescription' | 'lab_report' | 'imaging' | 'medical_record' | 'consent' | 'other',
  ) => {
    const icons: Record<
      'prescription' | 'lab_report' | 'imaging' | 'medical_record' | 'consent' | 'other',
      string
    > = {
      prescription: '💊',
      lab_report: '🔬',
      imaging: '📷',
      medical_record: '📋',
      consent: '📝',
      other: '📄',
    };
    return icons[type] || '📄';
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Vista compacta
  if (compact) {
    const recentDocuments = filteredDocuments.slice(0, 3);
    const confidentialCount = documents.filter((d) => d.isConfidential).length;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Documentos</h3>
          {confidentialCount > 0 && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
              {confidentialCount} confidenciales
            </span>
          )}
        </div>

        {recentDocuments.length === 0 ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">📄</span>
            <p className="text-gray-500">No hay documentos recientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onDocumentClick?.(doc)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getDocumentIcon(doc.type)}</span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{doc.title}</p>
                      <p className="text-xs text-gray-600">{doc.category}</p>
                      <p className="text-xs text-gray-500">
                        {doc.date.toLocaleDateString('es-MX')} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  {doc.isConfidential && (
                    <span className="text-red-500" title="Documento confidencial">
                      🔒
                    </span>
                  )}
                </div>
              </button>
            ))}

            {filteredDocuments.length > 3 && (
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver {filteredDocuments.length - 3} documentos más...
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Vista completa
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Documentos Médicos</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 's' : ''}{' '}
              encontrado{filteredDocuments.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {allowUpload && (
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                <span className="mr-2">📤</span>
                Subir Documento
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Búsqueda */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar documentos..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filtro por categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            {/* Ordenar por */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="date">Más recientes</option>
              <option value="name">Por nombre</option>
              <option value="size">Por tamaño</option>
            </select>
          </div>

          {/* Mostrar confidenciales */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showConfidential}
              onChange={(e) => setShowConfidential(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Mostrar confidenciales</span>
          </label>
        </div>
      </div>

      {/* Lista de documentos */}
      <div className="p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-3 block">🔍</span>
            <p className="text-gray-500">No se encontraron documentos con los filtros aplicados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                onClick={() => onDocumentClick?.(doc)}
                onDownload={() => onDownload?.(doc.id)}
                onDelete={() => onDelete?.(doc.id)}
                allowDelete={allowUpload}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer con estadísticas */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-1 font-medium text-gray-900">{documents.length} documentos</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Tamaño total:</span>
              <span className="ml-1 font-medium text-gray-900">
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.size, 0))}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div>
              <span className="text-gray-600">Confidenciales:</span>
              <span className="ml-1 font-medium text-red-600">
                {documents.filter((d) => d.isConfidential).length}
              </span>
            </div>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">Exportar lista</button>
        </div>
      </div>
    </div>
  );
};

// Componente para tarjeta de documento
const DocumentCard: React.FC<{
  document: MedicalDocument;
  onClick?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  allowDelete?: boolean;
}> = ({ document, onClick, onDownload, onDelete, allowDelete }) => {
  const getDocumentIcon = (
    type: 'prescription' | 'lab_report' | 'imaging' | 'medical_record' | 'consent' | 'other',
  ) => {
    const icons: Record<
      'prescription' | 'lab_report' | 'imaging' | 'medical_record' | 'consent' | 'other',
      string
    > = {
      prescription: '💊',
      lab_report: '🔬',
      imaging: '📷',
      medical_record: '📋',
      consent: '📝',
      other: '📄',
    };
    return icons[type] || '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getDocumentIcon(document.type)}</span>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{document.title}</h4>
            <p className="text-xs text-gray-600">{document.category}</p>
          </div>
        </div>
        {document.isConfidential && (
          <span className="text-red-500 text-lg" title="Documento confidencial">
            🔒
          </span>
        )}
      </div>

      {document.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">{document.description}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-3">
        {document.tags.slice(0, 3).map((tag, index) => (
          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {tag}
          </span>
        ))}
        {document.tags.length > 3 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            +{document.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
        <span>{document.date.toLocaleDateString('es-MX')}</span>
        <span>{formatFileSize(document.size)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Por: {document.uploadedBy}</span>
        <div className="flex items-center space-x-2">
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
              title="Descargar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
            </button>
          )}
          {onClick && (
            <button
              onClick={onClick}
              className="p-1 text-gray-500 hover:text-green-600 transition-colors"
              title="Ver detalles"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </button>
          )}
          {allowDelete && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 text-gray-500 hover:text-red-600 transition-colors"
              title="Eliminar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalDocuments;
