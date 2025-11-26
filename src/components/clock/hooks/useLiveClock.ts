import { useState, useEffect } from 'react';
import { ClockConfig } from '../types';

interface LiveClock {
  time: string;
  date: string;
}

/**
 * Returns the current time and date strings in the specified timezone.
 * Handles 12/24 hour format and DST automatically.
 */
export const useLiveClock = (config: ClockConfig): LiveClock => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  const updateClock = () => {
    const now = new Date();

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: !config.format24Hr,
      timeZone: config.timezone,
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: config.timezone,
    };

    setTime(now.toLocaleTimeString('en-US', timeOptions));
    setDate(now.toLocaleDateString('en-US', dateOptions));
  };

  useEffect(() => {
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [config.timezone, config.format24Hr]);

  return { time, date };
};
