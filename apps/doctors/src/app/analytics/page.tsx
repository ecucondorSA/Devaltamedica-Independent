'use client'

import { useState } from 'react'
import { 
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  Activity,
  PieChart,
  Download,
  Filter
} from 'lucide-react'
import { Button } from '@altamedica/ui'
import { useAppointments } from '@/hooks/queries/useAppointments'
import { usePatients } from '@/hooks/queries/usePatients'

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('appointments')

  // Fetch data using React Query with proper typing
  const { data: appointmentsData } = useAppointments()
  const { data: patientsData } = usePatients()
  
  // Type the arrays properly
  const appointments = (appointmentsData || []) as Array<{ 
    id: string; 
    status: string; 
    type: string; 
    patientId: string;
    date: string;
  }>
  const patients = (patientsData || []) as Array<{ 
    id: string; 
    name: string; 
    email: string;
  }>

  // Calculate metrics
  const totalAppointments = appointments.length
  const completedAppointments = appointments.filter(a => a.status === 'completed').length
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length
  const telemedicineAppointments = appointments.filter(a => a.type === 'telemedicine').length

  const completionRate = totalAppointments > 0 
    ? Math.round((completedAppointments / totalAppointments) * 100) 
    : 0

  const cancellationRate = totalAppointments > 0
    ? Math.round((cancelledAppointments / totalAppointments) * 100)
    : 0

  const telemedicineRate = totalAppointments > 0
    ? Math.round((telemedicineAppointments / totalAppointments) * 100)
    : 0

  const metrics = [
    {
      title: 'Total Appointments',
      value: totalAppointments,
      change: '+12.5%',
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Active Patients',
      value: patients.length,
      change: '+8.2%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      change: '+5.1%',
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Revenue',
      value: '$45,231',
      change: '+18.7%',
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your practice performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="quarter">Last 3 months</option>
            <option value="year">Last year</option>
          </select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.title} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold mt-1">{metric.value}</p>
                  <p className="text-sm mt-2">
                    <span className="text-green-600 font-medium">{metric.change}</span>
                    <span className="text-gray-500"> vs last period</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Appointments Trend</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-2" />
              <p>Chart visualization would go here</p>
            </div>
          </div>
        </div>

        {/* Appointment Types */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Appointment Types</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">In-person Consultation</span>
              </div>
              <span className="font-medium">{100 - telemedicineRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Telemedicine</span>
              </div>
              <span className="font-medium">{telemedicineRate}%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Follow-up</span>
              </div>
              <span className="font-medium">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Emergency</span>
              </div>
              <span className="font-medium">5%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            {/* Average Consultation Time */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Average Consultation Time</p>
                  <p className="text-sm text-gray-600">Per appointment</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">32 min</p>
                <p className="text-sm text-green-600">-3 min vs last month</p>
              </div>
            </div>

            {/* Patient Satisfaction */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Patient Satisfaction</p>
                  <p className="text-sm text-gray-600">Based on feedback</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">4.8/5.0</p>
                <p className="text-sm text-green-600">+0.2 vs last month</p>
              </div>
            </div>

            {/* Cancellation Rate */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="font-medium">Cancellation Rate</p>
                  <p className="text-sm text-gray-600">Last 30 days</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{cancellationRate}%</p>
                <p className="text-sm text-red-600">+2% vs last month</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Conditions Treated */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h3 className="font-semibold mb-4">Top Conditions Treated</h3>
          <div className="space-y-3">
            {['Hypertension', 'Diabetes Type 2', 'Anxiety', 'Back Pain', 'Migraine'].map((condition, idx) => (
              <div key={condition} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-500">{idx + 1}.</span>
                  <span>{condition}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${100 - (idx * 15)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {100 - (idx * 15)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}