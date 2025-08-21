'use client';

import React, { useState, useEffect } from 'react';
import { Medication } from '../../../types/medical-types';
import { formatDate } from '../../../utils/medical-helpers';

interface MedicationTrackerProps {
  medications: Medication[];
  compact?: boolean;
  showSchedule?: boolean;
  showInteractions?: boolean;
  onMedicationTaken?: (medicationId: string) => void;
  onRefillRequest?: (medicationId: string) => void;
}

const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  medications,
  compact = false,
  showSchedule = false,
  showInteractions = false,
  onMedicationTaken,
  onRefillRequest
}) => {
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [takenToday, setTakenToday] = useState<Set<string>>(new Set());
  const [showReminders, setShowReminders] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clasificar medicamentos
  const activeMedications = medications.filter(m => m.status === 'active');
  const suspendedMedications = medications.filter(m => m.status === 'suspended');
  const needsRefill = activeMedications.filter(m => 
    m.refillsRemaining !== undefined && m.refillsRemaining <= 1
  );

  // Horario de medicación del día
  const getTodaySchedule = () => {
    const schedule: any[] = [];
    const today = new Date();
    
    activeMedications.forEach(med => {
      const doses = parseDosageSchedule(med.frequency);
      doses.forEach(time => {
        schedule.push({
          medication: med,
          time,
          taken: takenToday.has(`${med.id}-${time}`),
          isPast: new Date(`${today.toDateString()} ${time}`) < currentTime
        });
      });
    });

    return schedule.sort((a, b) => 
      new Date(`${today.toDateString()} ${a.time}`).getTime() - 
      new Date(`${today.toDateString()} ${b.time}`).getTime()
    );
  };

  // Parsear horario de frecuencia
  const parseDosageSchedule = (frequency: string): string[] => {
    const scheduleMap: Record<string, string[]> = {
      'Una vez al día': ['08:00'],
      'Dos veces al día': ['08:00', '20:00'],
      'Tres veces al día': ['08:00', '14:00', '20:00'],
      'Cuatro veces al día': ['08:00', '12:00', '16:00', '20:00'],
      'Cada 8 horas': ['06:00', '14:00', '22:00'],
      'Cada 12 horas': ['08:00', '20:00'],
      'Antes de dormir': ['22:00'],
      'Con las comidas': ['08:00', '13:00', '19:00']
    };
    
    return scheduleMap[frequency] || ['08:00'];
  };

  // Detectar interacciones medicamentosas
  const detectInteractions = (med: Medication) => {
    const interactions: any[] = [];
    
    activeMedications.forEach(otherMed => {
      if (otherMed.id !== med.id && med.interactions) {
        med.interactions.forEach(interaction => {
          if (otherMed.name.toLowerCase().includes(interaction.toLowerCase()) ||
              otherMed.genericName?.toLowerCase().includes(interaction.toLowerCase())) {
            interactions.push({
              medication: otherMed.name,
              type: 'warning',
              description: `Posible interacción con ${otherMed.name}`
            });
          }
        });
      }
    });

    return interactions;
  };

  // Marcar medicamento como tomado
  const handleMedicationTaken = (medicationId: string, time: string) => {
    const key = `${medicationId}-${time}`;
    setTakenToday(prev => new Set(prev).add(key));
    onMedicationTaken?.(medicationId);
  };

  // Vista compacta
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Medicamentos</h3>
          {needsRefill.length > 0 && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
              {needsRefill.length} requieren resurtido
            </span>
          )}
        </div>

        <div className="space-y-3">
          {activeMedications.slice(0, 3).map((med) => (
            <div key={med.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">💊</span>
                <div>
                  <p className="font-medium text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                </div>
              </div>
              {med.refillsRemaining !== undefined && med.refillsRemaining <= 1 && (
                <span className="text-yellow-600" title="Requiere resurtido">⚠️</span>
              )}
            </div>
          ))}
          
          {activeMedications.length > 3 && (
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver {activeMedications.length - 3} más...
            </button>
          )}
        </div>
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
            <h2 className="text-xl font-bold text-gray-900">Gestión de Medicamentos</h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeMedications.length} medicamentos activos
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowReminders(!showReminders)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showReminders
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <span className="mr-2">🔔</span>
              Recordatorios
            </button>
          </div>
        </div>
      </div>

      {/* Alertas de resurtido */}
      {needsRefill.length > 0 && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center">
            <span className="text-yellow-600 text-xl mr-3">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                {needsRefill.length} medicamento{needsRefill.length > 1 ? 's' : ''} requiere{needsRefill.length > 1 ? 'n' : ''} resurtido
              </p>
            </div>
            <button className="text-sm text-yellow-700 hover:text-yellow-800 font-medium">
              Ver detalles
            </button>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Horario del día */}
        {showSchedule && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Horario de Hoy
            </h3>
            <div className="space-y-2">
              {getTodaySchedule().map((item, index) => (
                <ScheduleItem
                  key={index}
                  item={item}
                  onTaken={() => handleMedicationTaken(item.medication.id, item.time)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lista de medicamentos */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Medicamentos Activos
          </h3>
          
          {activeMedications.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              isExpanded={selectedMedication === med.id}
              onToggle={() => setSelectedMedication(
                selectedMedication === med.id ? null : med.id
              )}
              onRefillRequest={() => onRefillRequest?.(med.id)}
              showInteractions={showInteractions}
              interactions={showInteractions ? detectInteractions(med) : []}
            />
          ))}
        </div>

        {/* Medicamentos suspendidos */}
        {suspendedMedications.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Medicamentos Suspendidos
            </h3>
            <div className="space-y-3 opacity-60">
              {suspendedMedications.map((med) => (
                <div key={med.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 line-through">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        Suspendido desde: {formatDate(med.endDate || new Date())}
                      </p>
                    </div>
                    <span className="text-gray-400">🚫</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Panel de información adicional */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">
              Total de medicamentos: <span className="font-medium text-gray-900">{medications.length}</span>
            </span>
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-gray-600">
              Última actualización: <span className="font-medium text-gray-900">Hoy, {currentTime.toLocaleTimeString()}</span>
            </span>
          </div>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Historial completo
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para item del horario
const ScheduleItem: React.FC<{
  item: any;
  onTaken: () => void;
}> = ({ item, onTaken }) => {
  const { medication, time, taken, isPast } = item;
  
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      taken ? 'bg-green-50 border-green-200' : 
      isPast ? 'bg-red-50 border-red-200' : 
      'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <span className="text-2xl">💊</span>
        <div>
          <p className="font-medium text-gray-900">{medication.name}</p>
          <p className="text-sm text-gray-600">{medication.dosage}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className={`font-medium ${
          taken ? 'text-green-600' : 
          isPast ? 'text-red-600' : 
          'text-gray-600'
        }`}>
          {time}
        </span>
        
        {!taken && (
          <button
            onClick={onTaken}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              isPast
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Marcar como tomado
          </button>
        )}
        
        {taken && (
          <span className="text-green-600 text-xl">✓</span>
        )}
      </div>
    </div>
  );
};

// Componente para tarjeta de medicamento
const MedicationCard: React.FC<{
  medication: Medication;
  isExpanded: boolean;
  onToggle: () => void;
  onRefillRequest: () => void;
  showInteractions: boolean;
  interactions: any[];
}> = ({ medication, isExpanded, onToggle, onRefillRequest, showInteractions, interactions }) => {
  const needsRefill = medication.refillsRemaining !== undefined && medication.refillsRemaining <= 1;
  
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">💊</span>
            <div>
              <h4 className="font-semibold text-gray-900">{medication.name}</h4>
              {medication.genericName && (
                <p className="text-xs text-gray-500">({medication.genericName})</p>
              )}
              <p className="text-sm text-gray-600 mt-1">
                {medication.dosage} - {medication.frequency}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {needsRefill && (
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                Resurtir pronto
              </span>
            )}
            {interactions.length > 0 && showInteractions && (
              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                {interactions.length} interacciones
              </span>
            )}
            <svg 
              className={`w-5 h-5 text-gray-400 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-sm text-gray-600">Prescrito por</p>
              <p className="font-medium text-gray-900">{medication.prescribedBy}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Propósito</p>
              <p className="font-medium text-gray-900">{medication.purpose}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de inicio</p>
              <p className="font-medium text-gray-900">{formatDate(medication.startDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Vía de administración</p>
              <p className="font-medium text-gray-900 capitalize">{medication.route}</p>
            </div>
          </div>
          
          {medication.instructions && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Instrucciones especiales</p>
              <p className="mt-1 text-gray-900 bg-blue-50 p-3 rounded-lg text-sm">
                {medication.instructions}
              </p>
            </div>
          )}
          
          {medication.sideEffects && medication.sideEffects.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Efectos secundarios posibles</p>
              <div className="flex flex-wrap gap-2">
                {medication.sideEffects.map((effect, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                    {effect}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {showInteractions && interactions.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 rounded-lg">
              <p className="text-sm font-medium text-orange-800 mb-2">
                ⚠️ Interacciones detectadas
              </p>
              {interactions.map((interaction, index) => (
                <p key={index} className="text-sm text-orange-700">
                  • {interaction.description}
                </p>
              ))}
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between">
            <div>
              {medication.refillsRemaining !== undefined && (
                <p className="text-sm text-gray-600">
                  Resurtidos restantes: <span className="font-medium text-gray-900">{medication.refillsRemaining}</span>
                </p>
              )}
            </div>
            {needsRefill && (
              <button
                onClick={onRefillRequest}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Solicitar resurtido
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicationTracker; 