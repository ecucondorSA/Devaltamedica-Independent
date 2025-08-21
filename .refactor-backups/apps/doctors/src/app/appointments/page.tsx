'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  Calendar,
  Clock,
  User,
  Video,
  MapPin,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { AppointmentCard, useMedicalData, formatShortDate } from '@altamedica/medical'

import { logger } from '@altamedica/shared/services/logger.service';
export default function AppointmentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter') || 'today'
  
  const { fetchAppointments, loading } = useMedicalData('http://localhost:3001/api/v1')
  const [appointments, setAppointments] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day')

  useEffect(() => {
    loadAppointments()
  }, [filter, selectedDate])

  const loadAppointments = async () => {
    try {
      const filters: any = {}
      
      if (filter === 'today') {
        const today = new Date()
        filters.dateFrom = new Date(today.setHours(0, 0, 0, 0))
        filters.dateTo = new Date(today.setHours(23, 59, 59, 999))
      } else if (filter === 'upcoming') {
        filters.dateFrom = new Date()
        filters.status = 'scheduled'
      } else if (filter === 'past') {
        filters.dateTo = new Date()
        filters.status = 'completed'
      }
      
      const data = await fetchAppointments(filters)
      setAppointments(data)
    } catch (error) {
      logger.error('Error loading appointments:', error)
    }
  }

  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    const today = new Date()
    return aptDate.toDateString() === today.toDateString()
  })

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date)
    return aptDate > new Date() && apt.status === 'scheduled'
  })

  const getTimeSlots = () => {
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      slots.push({
        time: `${hour}:00`,
        appointment: todayAppointments.find(apt => {
          const aptHour = new Date(apt.date).getHours()
          return aptHour === hour
        })
      })
    }
    return slots
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setSelectedDate(newDate)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-gray-600">Manage your consultations and schedules</p>
        </div>
        <Button onClick={() => router.push('/appointments/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold">{todayAppointments.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Telemedicine</p>
              <p className="text-2xl font-bold">
                {appointments.filter(apt => apt.type === 'telemedicine').length}
              </p>
            </div>
            <Video className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold">
                {appointments.filter(apt => apt.status === 'completed').length}
              </p>
            </div>
            <User className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Calendar View */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Calendar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h2>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedDate(new Date())}
                  className="px-3 py-1 text-sm rounded hover:bg-gray-100"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="px-3 py-1 border rounded-lg text-sm"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Time Slots */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : viewMode === 'day' ? (
            <div className="space-y-2">
              {getTimeSlots().map((slot) => (
                <div key={slot.time} className="flex items-start space-x-4">
                  <div className="w-20 text-sm text-gray-500 pt-2">
                    {slot.time}
                  </div>
                  <div className="flex-1">
                    {slot.appointment ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{slot.appointment.patientName}</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {slot.appointment.reason}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {slot.appointment.duration} min
                              </span>
                              {slot.appointment.type === 'telemedicine' ? (
                                <span className="flex items-center text-purple-600">
                                  <Video className="h-4 w-4 mr-1" />
                                  Video Call
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  In-person
                                </span>
                              )}
                            </div>
                          </div>
                          <button className="p-1 rounded hover:bg-blue-100">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center text-gray-400">
                        Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  onClick={() => router.push(`/appointments/${appointment.id}`)}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <AppointmentCard
                    appointment={appointment}
                    patientName={appointment.patientName}
                  />
                  
                  {/* Botón rápido para telemedicina */}
                  {appointment.type === 'telemedicine' && appointment.status === 'confirmed' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/telemedicine/session/${appointment.id}`);
                        }}
                        className="w-full flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <Video className="w-4 h-4" />
                        <span>Iniciar Videollamada</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Appointments List */}
      {filter === 'upcoming' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Appointments</h3>
          <div className="space-y-3">
            {upcomingAppointments.slice(0, 5).map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/appointments/${appointment.id}`)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{appointment.patientName}</p>
                    <p className="text-sm text-gray-600">
                      {formatShortDate(appointment.date)} • {appointment.type}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}