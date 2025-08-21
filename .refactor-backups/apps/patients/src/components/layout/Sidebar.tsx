
/**
 * Sidebar.tsx - Barra Lateral del Dashboard
 * Proyecto: Altamedica Pacientes
 */

import React from "react";
import {
  Pill,
  FileText,
  Download,
  MapPin,
  Video,
  Phone,
} from "lucide-react";
import { CardCorporate } from '@altamedica/ui';
import { CardHeaderCorporate, CardContentCorporate } from '../CardCorporate';
import { ButtonCorporate } from '@altamedica/ui';
import { useRouter } from "next/navigation";

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  status: string;
}

interface SidebarProps {
  prescriptions: Prescription[];
}

export const Sidebar: React.FC<SidebarProps> = ({ prescriptions }) => {
  const router = useRouter();

  return (
    <aside className="w-full lg:w-1/3 space-y-6">
      {/* Prescripciones Activas */}
      <CardCorporate variant="default" size="md">
        <CardHeaderCorporate>
          <h2 className="flex items-center text-lg font-medium text-gray-900">
            <Pill className="w-5 h-5 mr-2 text-green-600" />
            Medicación Activa
          </h2>
        </CardHeaderCorporate>
        <CardContentCorporate className="p-4">
          {prescriptions.length > 0 ? (
            <div className="space-y-3">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="py-2 pl-3 border-l-4 border-green-400">
                  <h4 className="text-sm font-medium text-gray-800">{prescription.medication}</h4>
                  <p className="text-sm text-gray-600">{prescription.dosage} - {prescription.frequency}</p>
                </div>
              ))}
              <ButtonCorporate
                variant="ghost"
                size="sm"
                className="w-full mt-3"
                onClick={() => router.push("/prescriptions")}
              >
                Ver todas
              </ButtonCorporate>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Pill className="w-8 h-8 mx-auto mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">No tienes prescripciones activas.</p>
            </div>
          )}
        </CardContentCorporate>
      </CardCorporate>

      {/* Accesos Rápidos */}
      <CardCorporate variant="default" size="md">
        <CardHeaderCorporate>
          <h2 className="text-lg font-medium text-gray-900">Accesos Rápidos</h2>
        </CardHeaderCorporate>
        <CardContentCorporate className="p-4">
          <div className="space-y-2">
            <ButtonCorporate
              variant="ghost"
              className="justify-start w-full h-auto p-3 text-left"
              onClick={() => router.push("/medical-history")}
            >
              <FileText className="w-5 h-5 mr-3 text-blue-600 flex-shrink-0" />
              <div>
                <div className="font-medium">Historial Médico</div>
                <div className="text-xs text-gray-500">Consulta tus registros.</div>
              </div>
            </ButtonCorporate>
            <ButtonCorporate
              variant="ghost"
              className="justify-start w-full h-auto p-3 text-left"
              onClick={() => router.push("/test-results")}
            >
              <Download className="w-5 h-5 mr-3 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-medium">Resultados</div>
                <div className="text-xs text-gray-500">Descarga análisis y estudios.</div>
              </div>
            </ButtonCorporate>
            <ButtonCorporate
              variant="ghost"
              className="justify-start w-full h-auto p-3 text-left"
              onClick={() => router.push("/doctors")}
            >
              <MapPin className="w-5 h-5 mr-3 text-purple-600 flex-shrink-0" />
              <div>
                <div className="font-medium">Buscar Doctores</div>
                <div className="text-xs text-gray-500">Encuentra especialistas.</div>
              </div>
            </ButtonCorporate>
            <ButtonCorporate
              variant="ghost"
              className="justify-start w-full h-auto p-3 text-left"
              onClick={() => router.push("/telemedicine")}
            >
              <Video className="w-5 h-5 mr-3 text-blue-500 flex-shrink-0" />
              <div>
                <div className="font-medium">Telemedicina</div>
                <div className="text-xs text-gray-500">Accede a consultas virtuales.</div>
              </div>
            </ButtonCorporate>
            <ButtonCorporate
              variant="ghost"
              className="justify-start w-full h-auto p-3 text-left"
              onClick={() => window.open("tel:+541122334455")}
            >
              <Phone className="w-5 h-5 mr-3 text-red-600 flex-shrink-0" />
              <div>
                <div className="font-medium">Contactar Soporte</div>
                <div className="text-xs text-gray-500">Asistencia 24/7.</div>
              </div>
            </ButtonCorporate>
          </div>
        </CardContentCorporate>
      </CardCorporate>
    </aside>
  );
};
