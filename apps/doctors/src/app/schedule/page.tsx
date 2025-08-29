'use client'

import { useState } from 'react'
import { 
  Calendar,
  Clock,
  Settings,
  Save,
  Plus,
  X,
  Coffee,
  AlertCircle
} from 'lucide-react'
import { Button } from '@altamedica/ui'

import { logger } from '@altamedica/shared';
interface TimeSlot {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isAvailable: boolean
  slotDuration: number
}

interface BreakTime {
  id: string
  startTime: string
  endTime: string
  label: string
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
]

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState('weekly')
  const [slotDuration, setSlotDuration] = useState(30)
  const [scheduleModified, setScheduleModified] = useState(false)
  
  const [weeklySchedule, setWeeklySchedule] = useState<TimeSlot[]>([
    { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00', isAvailable: true, slotDuration: 30 },
    { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00', isAvailable: true, slotDuration: 30 },
    { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00', isAvailable: true, slotDuration: 30 },
    { id: '4', dayOfWeek: 4, startTime: '09:00', endTime: '17:00', isAvailable: true, slotDuration: 30 },
    { id: '5', dayOfWeek: 5, startTime: '09:00', endTime: '17:00', isAvailable: true, slotDuration: 30 },
    { id: '6', dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isAvailable: true, slotDuration: 30 },
    { id: '7', dayOfWeek: 0, startTime: '09:00', endTime: '13:00', isAvailable: false, slotDuration: 30 }
  ])

  const [breaks, setBreaks] = useState<BreakTime[]>([
    { id: '1', startTime: '13:00', endTime: '14:00', label: 'Lunch Break' }
  ])

  const handleScheduleChange = (dayIndex: number, field: string, value: any) => {
    setWeeklySchedule(prev => prev.map(slot => 
      slot.dayOfWeek === dayIndex 
        ? { ...slot, [field]: value }
        : slot
    ))
    setScheduleModified(true)
  }

  const addBreak = () => {
    const newBreak: BreakTime = {
      id: Date.now().toString(),
      startTime: '12:00',
      endTime: '13:00',
      label: 'Break'
    }
    setBreaks([...breaks, newBreak])
    setScheduleModified(true)
  }

  const removeBreak = (id: string) => {
    setBreaks(breaks.filter(b => b.id !== id))
    setScheduleModified(true)
  }

  const saveSchedule = () => {
    // Save schedule to backend
    logger.info('Saving schedule...', JSON.stringify({ weeklySchedule, breaks, slotDuration }))
    setScheduleModified(false)
  }

  const tabs = [
    { id: 'weekly', label: 'Weekly Schedule' },
    { id: 'exceptions', label: 'Exceptions' },
    { id: 'vacation', label: 'Vacation Days' },
    { id: 'settings', label: 'Settings' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
          <p className="text-gray-600">Configure your availability for appointments</p>
        </div>
        {scheduleModified && (
          <Button onClick={saveSchedule}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        )}
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800">Schedule Information</h4>
            <p className="text-sm text-blue-700 mt-1">
              Your schedule determines when patients can book appointments with you. 
              Changes will apply to future bookings only.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'weekly' && (
            <div className="space-y-6">
              {/* Slot Duration */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h3 className="font-semibold">Appointment Duration</h3>
                  <p className="text-sm text-gray-600">Default duration for each appointment slot</p>
                </div>
                <select
                  value={slotDuration}
                  onChange={(e) => {
                    setSlotDuration(Number(e.target.value))
                    setScheduleModified(true)
                  }}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>

              {/* Weekly Schedule */}
              <div>
                <h3 className="font-semibold mb-4">Weekly Hours</h3>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((day, index) => {
                    const schedule = weeklySchedule.find(s => s.dayOfWeek === index)
                    if (!schedule) return null

                    return (
                      <div key={day} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-32">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={schedule.isAvailable}
                              onChange={(e) => handleScheduleChange(index, 'isAvailable', e.target.checked)}
                              className="rounded"
                            />
                            <span className="font-medium">{day}</span>
                          </label>
                        </div>
                        
                        {schedule.isAvailable ? (
                          <>
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => handleScheduleChange(index, 'startTime', e.target.value)}
                                className="px-3 py-1 border rounded"
                              />
                              <span className="text-gray-500">to</span>
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => handleScheduleChange(index, 'endTime', e.target.value)}
                                className="px-3 py-1 border rounded"
                              />
                            </div>
                          </>
                        ) : (
                          <span className="text-gray-500">Unavailable</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Break Times */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Break Times</h3>
                  <Button size="sm" onClick={addBreak}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Break
                  </Button>
                </div>
                <div className="space-y-3">
                  {breaks.map((breakTime) => (
                    <div key={breakTime.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <Coffee className="h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={breakTime.label}
                        onChange={(e) => {
                          setBreaks(prev => prev.map(b => 
                            b.id === breakTime.id ? { ...b, label: e.target.value } : b
                          ))
                          setScheduleModified(true)
                        }}
                        className="px-3 py-1 border rounded"
                      />
                      <input
                        type="time"
                        value={breakTime.startTime}
                        onChange={(e) => {
                          setBreaks(prev => prev.map(b => 
                            b.id === breakTime.id ? { ...b, startTime: e.target.value } : b
                          ))
                          setScheduleModified(true)
                        }}
                        className="px-3 py-1 border rounded"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={breakTime.endTime}
                        onChange={(e) => {
                          setBreaks(prev => prev.map(b => 
                            b.id === breakTime.id ? { ...b, endTime: e.target.value } : b
                          ))
                          setScheduleModified(true)
                        }}
                        className="px-3 py-1 border rounded"
                      />
                      <button
                        onClick={() => removeBreak(breakTime.id)}
                        className="p-1 rounded hover:bg-gray-200"
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Configure specific dates with different hours</p>
              <Button className="mt-4">Add Exception</Button>
            </div>
          )}

          {activeTab === 'vacation' && (
            <div className="text-center py-12 text-gray-500">
              <Coffee className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Mark your vacation days</p>
              <Button className="mt-4">Add Vacation Period</Button>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Booking Rules</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Advance Booking</p>
                      <p className="text-sm text-gray-600">How far in advance can patients book?</p>
                    </div>
                    <select className="px-4 py-2 border rounded-lg">
                      <option>1 week</option>
                      <option>2 weeks</option>
                      <option>1 month</option>
                      <option>3 months</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Minimum Notice</p>
                      <p className="text-sm text-gray-600">Minimum time before appointment</p>
                    </div>
                    <select className="px-4 py-2 border rounded-lg">
                      <option>2 hours</option>
                      <option>4 hours</option>
                      <option>24 hours</option>
                      <option>48 hours</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Buffer Time</p>
                      <p className="text-sm text-gray-600">Time between appointments</p>
                    </div>
                    <select className="px-4 py-2 border rounded-lg">
                      <option>No buffer</option>
                      <option>5 minutes</option>
                      <option>10 minutes</option>
                      <option>15 minutes</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}