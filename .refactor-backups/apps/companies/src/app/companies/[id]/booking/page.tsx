'use client';

import { Button, Card, Input } from '@altamedica/ui';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Doctor } from '@altamedica/types';

interface TimeSlot {
  time: string;
  available: boolean;
  doctorId: string;
}

interface BookingData {
  doctorId: string;
  date: string;
  time: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  reason: string;
}

const mockDoctors: Doctor[] = [
  { id: 'doc1', name: 'Dr. García', specialty: 'Cardiólogo' },
  { id: 'doc2', name: 'Dr. López', specialty: 'Neurólogo' },
];

const mockTimeSlots: TimeSlot[] = [
  { time: '09:00', available: true, doctorId: 'doc1' },
  { time: '10:00', available: true, doctorId: 'doc1' },
  { time: '11:00', available: true, doctorId: 'doc2' },
  { time: '14:00', available: true, doctorId: 'doc2' },
  { time: '15:00', available: false, doctorId: 'doc1' },
  { time: '16:00', available: true, doctorId: 'doc2' },
];

export default function BookingPage() {
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [doctors] = useState<Doctor[]>(mockDoctors);
  const [timeSlots] = useState<TimeSlot[]>(mockTimeSlots);
  const [selectedDate, setSelectedDate] = useState('2024-01-15');
  const [bookingData, setBookingData] = useState<BookingData>({
    doctorId: '',
    date: '',
    time: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const availableDates = ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18'];
  
  const filteredTimeSlots = timeSlots.filter(slot => 
    !bookingData.doctorId || slot.doctorId === bookingData.doctorId
  );

  const handleDoctorSelect = (doctorId: string) => {
    setBookingData(prev => ({ ...prev, doctorId }));
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setBookingData(prev => ({ ...prev, date }));
  };

  const handleTimeSelect = (time: string) => {
    setBookingData(prev => ({ ...prev, time }));
  };

  const handleInputChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setCurrentStep(5); // Success step
    } catch (error) {
      // Error booking appointment - could implement proper error handling here
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return bookingData.doctorId !== '';
      case 2:
        return bookingData.date !== '' && bookingData.time !== '';
      case 3:
        return bookingData.patientName && bookingData.patientPhone && bookingData.patientEmail;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href={`/companies/${params.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a detalles
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Reservar Cita Médica</h1>
          <p className="text-gray-600">Complete los siguientes pasos para reservar su cita</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep <= 4 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
            
            {/* Step 1: Doctor Selection */}
            {currentStep === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Paso 1: Seleccionar Médico
                </h2>
                
                <div className="space-y-4">
                  <select
                    data-testid="doctor-select"
                    value={bookingData.doctorId}
                    onChange={(e) => handleDoctorSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un médico</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.specialty}
                      </option>
                    ))}
                  </select>
                  
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      data-testid="doctor-card"
                      className={`
                        p-4 rounded-lg border cursor-pointer transition-colors
                        ${bookingData.doctorId === doctor.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                        }
                      `}
                      onClick={() => handleDoctorSelect(doctor.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {doctor.name.charAt(3)}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doctor.name}</h3>
                          <p data-testid="doctor-role" className="text-sm text-gray-600">{doctor.specialty}</p>
                          <div data-testid="doctor-schedule" className="text-xs text-gray-500 mt-1">
                            Disponible: Lun-Vie 9:00-17:00
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date and Time Selection */}
            {currentStep === 2 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Paso 2: Seleccionar Fecha y Hora
                </h2>
                
                <div data-testid="availability-calendar" className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Fecha</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableDates.map((date) => (
                        <button
                          key={date}
                          data-testid={`calendar-date-${date}`}
                          onClick={() => handleDateSelect(date)}
                          className={`
                            p-3 rounded-lg border text-sm font-medium transition-colors
                            ${selectedDate === date 
                              ? 'border-blue-500 bg-blue-50 text-blue-700' 
                              : 'border-gray-200 text-gray-900 hover:border-gray-300'
                            }
                          `}
                        >
                          {new Date(date).toLocaleDateString('es-ES', { 
                            weekday: 'short', 
                            day: 'numeric', 
                            month: 'short' 
                          })}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time Selection */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Hora disponible</h3>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {filteredTimeSlots
                        .filter(slot => slot.available)
                        .map((slot) => (
                        <button
                          key={slot.time}
                          data-testid={`time-slot-${slot.time}`}
                          onClick={() => handleTimeSelect(slot.time)}
                          className={`
                            p-3 rounded-lg border text-sm font-medium transition-colors
                            ${bookingData.time === slot.time 
                              ? 'border-green-500 bg-green-50 text-green-700' 
                              : 'border-gray-200 text-gray-900 hover:border-gray-300'
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                    <div data-testid="available-slot" className="mt-2 text-xs text-gray-500">
                      {filteredTimeSlots.filter(slot => slot.available).length} horarios disponibles
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Patient Information */}
            {currentStep === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Paso 3: Información del Paciente
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      data-testid="patient-name"
                      required
                      value={bookingData.patientName}
                      onChange={(e) => handleInputChange('patientName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      data-testid="patient-phone"
                      required
                      value={bookingData.patientPhone}
                      onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      data-testid="patient-email"
                      required
                      value={bookingData.patientEmail}
                      onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo de la Consulta
                    </label>
                    <textarea
                      data-testid="appointment-reason"
                      rows={4}
                      value={bookingData.reason}
                      onChange={(e) => handleInputChange('reason', e.target.value)}
                      placeholder="Describe brevemente el motivo de su consulta..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirmation */}
            {currentStep === 4 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Paso 4: Confirmar Reserva
                </h2>
                
                <div data-testid="booking-summary" className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <h3 className="font-medium text-gray-900">Resumen de la Cita</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Médico:</span>
                      <div data-testid="summary-doctor" className="font-medium">
                        {doctors.find(d => d.id === bookingData.doctorId)?.name} - {doctors.find(d => d.id === bookingData.doctorId)?.specialty}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Fecha:</span>
                      <div data-testid="summary-date" className="font-medium">
                        {new Date(bookingData.date).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Hora:</span>
                      <div data-testid="summary-time" className="font-medium">
                        {bookingData.time}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Paciente:</span>
                      <div className="font-medium">
                        {bookingData.patientName}
                      </div>
                    </div>
                  </div>
                  
                  {bookingData.reason && (
                    <div>
                      <span className="text-gray-600 text-sm">Motivo:</span>
                      <div className="font-medium text-sm">
                        {bookingData.reason}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-8 border-t mt-8">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </button>
                )}
              </div>

              <div>
                {currentStep < 4 ? (
                  <button
                    type="button"
                    data-testid="next-step"
                    onClick={nextStep}
                    disabled={!isStepValid(currentStep)}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-testid="confirm-booking"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                        Confirmando...
                      </>
                    ) : (
                      'Confirmar Reserva'
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Success Step */}
        {currentStep === 5 && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <div data-testid="booking-success" className="space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¡Cita Reservada Exitosamente!
                </h2>
                <p className="text-gray-600">
                  Su cita ha sido confirmada. Recibirá un email de confirmación en breve.
                </p>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div data-testid="appointment-id" className="text-sm">
                  <strong>ID de Cita:</strong> apt1
                </div>
                <div className="text-sm mt-1">
                  <strong>Fecha:</strong> {new Date(bookingData.date).toLocaleDateString('es-ES')} a las {bookingData.time}
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <button
                  data-testid="download-receipt"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Descargar Comprobante
                </button>
                
                <Link
                  href={`/companies/${params.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Volver a Institución
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
