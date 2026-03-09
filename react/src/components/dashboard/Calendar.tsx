import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { DashboardEventsDto } from '@/types/dashboard.types';
import { EventDialog } from './EventDialog';

interface CalendarEvent {
  date: Date;
  title: string;
  type: 'leave' | 'holiday' | 'payroll' | 'event';
  description?: string;
  color?: string;
}

interface CalendarProps {
  events?: CalendarEvent[];
  dashboardEvents?: DashboardEventsDto[];
  onMonthChange?: (startDate: Date, endDate: Date) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  events = [], 
  dashboardEvents = [],
  onMonthChange 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentDate]);

  const monthName = useMemo(() => {
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  // Notify parent when month changes
  useEffect(() => {
    if (onMonthChange) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      onMonthChange(startDate, endDate);
    }
  }, [currentDate, onMonthChange]);

  // Combine dashboard events with leave events
  const allEvents = useMemo(() => {
    const combined: CalendarEvent[] = [...events];
    
    dashboardEvents.forEach((event) => {
      const eventDate = new Date(event.start);
      const eventType = event.type.toLowerCase();
      
      // Determine color based on event type
      let color = 'bg-gray-500';
      if (eventType === 'holiday') {
        // Regular Holiday = green, Special Holiday = yellow
        color = event.description === 'Special Holiday' ? 'bg-yellow-500' : 'bg-green-600';
      } else if (eventType === 'payroll') {
        color = 'bg-purple-500';
      } else if (eventType === 'event') {
        color = 'bg-blue-500';
      }
      
      combined.push({
        date: eventDate,
        title: event.title,
        type: eventType as CalendarEvent['type'],
        description: event.description,
        color,
      });
    });
    
    return combined;
  }, [events, dashboardEvents]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const getEventsForDay = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return allEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === dateToCheck.getDate() &&
        eventDate.getMonth() === dateToCheck.getMonth() &&
        eventDate.getFullYear() === dateToCheck.getFullYear()
      );
    });
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  const handleCloseEventDialog = () => {
    setIsEventDialogOpen(false);
    setSelectedEvent(null);
  };

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'leave':
        return 'bg-blue-400';
      case 'holiday':
        return 'bg-green-600'; // Regular holidays
      case 'payroll':
        return 'bg-purple-500';
      case 'event':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
          >
            Today
          </button>
          <button
            onClick={previousMonth}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of month */}
        {emptyDays.map((i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {/* Days of the month */}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day}
              className={`aspect-square p-1 rounded-lg flex flex-col items-start justify-start text-sm transition-colors relative overflow-hidden
                ${today ? 'bg-blue-500 text-white ring-2 ring-blue-600' : 'text-gray-700 dark:text-gray-300'}
              `}
            >
              <span className={`text-xs mb-0.5 ${today ? 'font-bold' : 'font-medium'}`}>{day}</span>
              {dayEvents.length > 0 && (
                <div className="flex flex-col gap-0.5 w-full text-[10px] leading-tight">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => handleEventClick(event, e)}
                      className={`${event.color || getEventColor(event.type)} text-white px-1 py-0.5 rounded text-left truncate hover:opacity-80 transition-opacity w-full`}
                      title={event.title}
                    >
                      {event.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[9px] text-gray-500 dark:text-gray-400 px-1">+{dayEvents.length - 2} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event Dialog */}
      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={handleCloseEventDialog}
        event={selectedEvent ? {
          title: selectedEvent.title,
          type: selectedEvent.type,
          description: selectedEvent.description,
          date: selectedEvent.date,
        } : null}
      />
    </div>
  );
};
