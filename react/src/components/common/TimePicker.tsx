import React, { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface TimePickerProps {
  hour?: number;
  minute?: number;
  ampm?: 'AM' | 'PM';
  onChange?: (hour: number, minute: number, ampm: 'AM' | 'PM') => void;
  label?: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export const TimePicker: React.FC<TimePickerProps> = ({
  hour = 12,
  minute = 0,
  ampm = 'AM',
  onChange,
  label,
}) => {
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute);
  const [ap, setAP] = useState<'AM' | 'PM'>(ampm);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 1;
    if (value < 1) value = 1;
    if (value > 12) value = 12;
    setH(value);
    onChange?.(value, m, ap);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    if (value < 0) value = 0;
    if (value > 59) value = 59;
    setM(value);
    onChange?.(h, value, ap);
  };

  const incrementHour = () => {
    const next = h === 12 ? 1 : h + 1;
    setH(next);
    onChange?.(next, m, ap);
  };

  const decrementHour = () => {
    const next = h === 1 ? 12 : h - 1;
    setH(next);
    onChange?.(next, m, ap);
  };

  const incrementMinute = () => {
    const next = m === 59 ? 0 : m + 1;
    setM(next);
    onChange?.(h, next, ap);
  };

  const decrementMinute = () => {
    const next = m === 0 ? 59 : m - 1;
    setM(next);
    onChange?.(h, next, ap);
  };

  const toggleAMPM = () => {
    const next = ap === 'AM' ? 'PM' : 'AM';
    setAP(next);
    onChange?.(h, m, next);
  };

  return (
    <div className="flex items-center gap-1">
      {label && <span className="mr-2 text-sm font-medium">{label}</span>}
      
      {/* Hour input with arrows */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementHour}
          className="w-6 h-4 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-t flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <ChevronUpIcon className="w-3 h-3" />
        </button>
        <input
          type="number"
          min={1}
          max={12}
          value={h}
          onChange={handleHourChange}
          className="w-20 px-3 py-2 border-x border-b rounded-b-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center"
        />
        <button
          type="button"
          onClick={decrementHour}
          className="w-6 h-4 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-b flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      </div>

      <span className="mx-1 text-lg font-semibold text-gray-700 dark:text-gray-200">:</span>

      {/* Minute input with arrows */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={incrementMinute}
          className="w-6 h-4 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-t flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <ChevronUpIcon className="w-3 h-3" />
        </button>
        <input
          type="number"
          min={0}
          max={59}
          value={pad(m)}
          onChange={handleMinuteChange}
          className="w-20 px-3 py-2 border-x border-b rounded-b-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-center"
        />
        <button
          type="button"
          onClick={decrementMinute}
          className="w-6 h-4 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-b flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <ChevronDownIcon className="w-3 h-3" />
        </button>
      </div>

      <button
        type="button"
        onClick={toggleAMPM}
        className="ml-2 px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {ap}
      </button>
    </div>
  );
};
