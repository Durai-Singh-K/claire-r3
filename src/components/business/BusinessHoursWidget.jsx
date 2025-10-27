import React from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';

const BusinessHoursWidget = ({ businessHours = [], timezone = 'Asia/Kolkata', compact = false, className = '' }) => {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = {
    monday: 'Mon',
    tuesday: 'Tue',
    wednesday: 'Wed',
    thursday: 'Thu',
    friday: 'Fri',
    saturday: 'Sat',
    sunday: 'Sun'
  };

  const getCurrentDayStatus = () => {
    if (!businessHours || businessHours.length === 0) {
      return { isOpen: null, message: 'Hours not set' };
    }

    const now = new Date();
    const currentDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1]; // Adjust for Monday start
    const todayHours = businessHours.find(h => h.day === currentDay);

    if (!todayHours || todayHours.isClosed) {
      return { isOpen: false, message: 'Closed today' };
    }

    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMin] = (todayHours.openTime || '09:00').split(':').map(Number);
    const [closeHour, closeMin] = (todayHours.closeTime || '18:00').split(':').map(Number);
    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    const isOpen = currentTime >= openTime && currentTime <= closeTime;
    const message = isOpen
      ? `Open until ${todayHours.closeTime}`
      : currentTime < openTime
      ? `Opens at ${todayHours.openTime}`
      : 'Closed';

    return { isOpen, message };
  };

  const status = getCurrentDayStatus();

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {status.isOpen !== null && (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            status.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {status.isOpen ? <CheckCircle size={14} /> : <XCircle size={14} />}
            {status.message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Current Status */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <Clock size={20} className="text-gray-600" />
          <span className="font-medium text-gray-900">Business Hours</span>
        </div>
        {status.isOpen !== null && (
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            status.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {status.isOpen ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {status.message}
          </span>
        )}
      </div>

      {/* Weekly Schedule */}
      {businessHours && businessHours.length > 0 ? (
        <div className="space-y-2">
          {days.map(day => {
            const dayHours = businessHours.find(h => h.day === day);
            const isToday = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] === day;

            return (
              <div
                key={day}
                className={`flex items-center justify-between py-2 px-3 rounded ${
                  isToday ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm capitalize ${isToday ? 'font-semibold text-blue-900' : 'text-gray-700'}`}>
                  {dayLabels[day]}
                </span>
                <span className="text-sm text-gray-600">
                  {dayHours
                    ? dayHours.isClosed
                      ? 'Closed'
                      : `${dayHours.openTime} - ${dayHours.closeTime}`
                    : 'Not set'}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No business hours set</p>
      )}

      {timezone && (
        <p className="text-xs text-gray-500 text-center">
          Timezone: {timezone}
        </p>
      )}
    </div>
  );
};

export default BusinessHoursWidget;
