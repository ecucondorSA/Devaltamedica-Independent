/**
 * Appointment Card Component
 * @module @altamedica/medical/components/AppointmentCard
 */
import React from 'react';
import { formatShortDate, getTimeUntilAppointment } from '../utils';
export const AppointmentCard = ({ appointment, patientName, doctorName, onClick, className = '' }) => {
    const statusColors = {
        scheduled: 'bg-blue-100 text-blue-800',
        confirmed: 'bg-green-100 text-green-800',
        'in-progress': 'bg-yellow-100 text-yellow-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800',
        'no-show': 'bg-orange-100 text-orange-800'
    };
    const typeIcons = {
        consultation: '🏥',
        telemedicine: '💻',
        emergency: '🚨',
        'follow-up': '🔄',
        'routine-checkup': '✅'
    };
    const timeUntil = appointment.status === 'scheduled' || appointment.status === 'confirmed'
        ? getTimeUntilAppointment(appointment.date)
        : null;
    return (<div className={`medical-card p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${className}`} onClick={onClick}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{typeIcons[appointment.type] || '📅'}</span>
          <div>
            <span className="font-medium capitalize">
              {appointment.type.replace('-', ' ')}
            </span>
            {timeUntil && (<p className="text-xs text-gray-500">in {timeUntil}</p>)}
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
          {appointment.status}
        </span>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">{formatShortDate(appointment.date)}</p>
        
        {(patientName || doctorName) && (<div className="text-sm text-gray-600">
            {patientName && <p>Patient: {patientName}</p>}
            {doctorName && <p>Doctor: {doctorName}</p>}
          </div>)}
        
        {appointment.reason && (<p className="text-sm text-gray-700 italic">"{appointment.reason}"</p>)}
      </div>
      
      <div className="mt-3 pt-3 border-t flex justify-between items-center">
        <span className="text-xs text-gray-500">
          Duration: {appointment.duration} min
        </span>
        {appointment.videoCallRoomId && (<span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            Video Call Ready
          </span>)}
      </div>
    </div>);
};
//# sourceMappingURL=AppointmentCard.jsx.map