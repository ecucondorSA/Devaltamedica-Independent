'use client';

import { useState, useEffect } from 'react';
import { logger } from '@altamedica/shared/services/logger.service';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Lock,
  Eye,
  Database,
  Clock,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

interface ComplianceCheck {
  id: string;
  name: string;
  category: 'hipaa' | 'gdpr' | 'medical' | 'security';
  status: 'compliant' | 'non-compliant' | 'warning' | 'pending';
  lastChecked: string;
  description: string;
  requirements: string[];
  violations: string[];
  score: number;
  priority: 'high' | 'medium' | 'low';
}

interface ComplianceReport {
  overallScore: number;
  hipaaScore: number;
  gdprScore: number;
  medicalScore: number;
  securityScore: number;
  totalChecks: number;
  compliantChecks: number;
  nonCompliantChecks: number;
  warnings: number;
  lastAudit: string;
  nextAudit: string;
}

export default function MedicalCompliance() {
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchComplianceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Simular datos de cumplimiento médico
        const mockChecks: ComplianceCheck[] = [
          {
            id: 'hipaa-001',
            name: 'Encriptación de Datos Médicos',
            category: 'hipaa',
            status: 'compliant',
            lastChecked: new Date().toISOString(),
            description: 'Verificación de encriptación AES-256 para datos médicos sensibles',
            requirements: ['AES-256 encryption', 'Key rotation', 'Secure transmission'],
            violations: [],
            score: 95,
            priority: 'high'
          },
          {
            id: 'hipaa-002',
            name: 'Control de Acceso',
            category: 'hipaa',
            status: 'compliant',
            lastChecked: new Date().toISOString(),
            description: 'Verificación de autenticación multi-factor y autorización',
            requirements: ['MFA enabled', 'Role-based access', 'Session timeout'],
            violations: [],
            score: 92,
            priority: 'high'
          },
          {
            id: 'gdpr-001',
            name: 'Consentimiento de Pacientes',
            category: 'gdpr',
            status: 'warning',
            lastChecked: new Date().toISOString(),
            description: 'Verificación de consentimiento explícito para procesamiento de datos',
            requirements: ['Explicit consent', 'Right to withdraw', 'Data portability'],
            violations: ['Consentimiento no verificado en 3 casos'],
            score: 78,
            priority: 'high'
          },
          {
            id: 'medical-001',
            name: 'Auditoría de Acceso',
            category: 'medical',
            status: 'compliant',
            lastChecked: new Date().toISOString(),
            description: 'Registro completo de accesos a datos médicos',
            requirements: ['Access logs', 'User identification', 'Timestamp recording'],
            violations: [],
            score: 88,
            priority: 'medium'
          },
          {
            id: 'security-001',
            name: 'Vulnerabilidades de Seguridad',
            category: 'security',
            status: 'non-compliant',
            lastChecked: new Date().toISOString(),
            description: 'Escaneo de vulnerabilidades en APIs médicas',
            requirements: ['No critical vulnerabilities', 'Regular scanning', 'Patch management'],
            violations: ['2 vulnerabilidades críticas detectadas', 'Parches pendientes'],
            score: 45,
            priority: 'high'
          },
          {
            id: 'hipaa-003',
            name: 'Backup y Recuperación',
            category: 'hipaa',
            status: 'compliant',
            lastChecked: new Date().toISOString(),
            description: 'Verificación de backup automático y recuperación de datos',
            requirements: ['Daily backups', 'Encrypted storage', 'Recovery testing'],
            violations: [],
            score: 90,
            priority: 'medium'
          }
        ];

        const mockReport: ComplianceReport = {
          overallScore: 82,
          hipaaScore: 92,
          gdprScore: 78,
          medicalScore: 88,
          securityScore: 45,
          totalChecks: 6,
          compliantChecks: 4,
          nonCompliantChecks: 1,
          warnings: 1,
          lastAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextAudit: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };

        setComplianceChecks(mockChecks);
        setComplianceReport(mockReport);
      } catch (err) {
        logger.error('Error fetching compliance data:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComplianceData();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchComplianceData, 300000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-600 bg-green-50 border-green-200';
      case 'non-compliant': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'pending': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant': return <CheckCircle className="w-5 h-5" />;
      case 'non-compliant': return <XCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hipaa': return <Shield className="w-4 h-4" />;
      case 'gdpr': return <FileText className="w-4 h-4" />;
      case 'medical': return <Database className="w-4 h-4" />;
      case 'security': return <Lock className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const filteredChecks = selectedCategory === 'all' 
    ? complianceChecks 
    : complianceChecks.filter(check => check.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <XCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error al cargar datos de cumplimiento</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Score General */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Cumplimiento Médico</h2>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
            <button className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200">
              <Download className="w-4 h-4 mr-2" />
              Exportar Reporte
            </button>
          </div>
        </div>

        {complianceReport && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Score General</p>
                  <p className="text-2xl font-bold">{complianceReport.overallScore}%</p>
                </div>
                <Shield className="w-8 h-8 opacity-80" />
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">HIPAA</p>
                  <p className="text-2xl font-bold text-green-700">{complianceReport.hipaaScore}%</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">GDPR</p>
                  <p className="text-2xl font-bold text-yellow-700">{complianceReport.gdprScore}%</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Seguridad</p>
                  <p className="text-2xl font-bold text-red-700">{complianceReport.securityScore}%</p>
                </div>
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Total de Verificaciones</p>
            <p className="text-lg font-semibold text-gray-900">{complianceReport?.totalChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Cumplientes</p>
            <p className="text-lg font-semibold text-green-600">{complianceReport?.compliantChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">No Cumplientes</p>
            <p className="text-lg font-semibold text-red-600">{complianceReport?.nonCompliantChecks}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Advertencias</p>
            <p className="text-lg font-semibold text-yellow-600">{complianceReport?.warnings}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2">
          {['all', 'hipaa', 'gdpr', 'medical', 'security'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'Todos' : category.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Verificaciones */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Verificaciones de Cumplimiento</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredChecks.map((check) => (
            <div key={check.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getCategoryIcon(check.category)}
                    <h4 className="text-lg font-medium text-gray-900">{check.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                      {getStatusIcon(check.status)}
                      <span className="ml-1">
                        {check.status === 'compliant' ? 'Cumpliente' :
                         check.status === 'non-compliant' ? 'No Cumpliente' :
                         check.status === 'warning' ? 'Advertencia' : 'Pendiente'}
                      </span>
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(check.priority)}`}>
                      {check.priority.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{check.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Requerimientos:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {check.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {check.violations.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-red-900 mb-2">Violaciones:</h5>
                        <ul className="text-sm text-red-600 space-y-1">
                          {check.violations.map((violation, index) => (
                            <li key={index} className="flex items-center">
                              <XCircle className="w-3 h-3 text-red-500 mr-2" />
                              {violation}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="ml-6 text-right">
                  <div className="text-2xl font-bold text-gray-900">{check.score}%</div>
                  <div className="text-sm text-gray-500">Score</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Última verificación: {new Date(check.lastChecked).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Información de Auditoría */}
      {complianceReport && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Auditoría</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Última Auditoría</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(complianceReport.lastAudit).toLocaleDateString('es-ES')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Próxima Auditoría</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(complianceReport.nextAudit).toLocaleDateString('es-ES')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 