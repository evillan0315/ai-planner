import { useState, useEffect, useMemo } from 'react';
import { ClockConfig, ClockDisplayType } from '@/components/clock/types';

interface LiveClockData {
  time: string;
  date: string;
  rawDate: Date;
  formatOptions: Intl.DateTimeFormatOptions;
}

/**
 * Custom hook to manage real-time clock updates for a specific timezone.
 * Uses the browser's Intl API for timezone-aware date creation and formatting.
 */
export const useLiveClock = (config: ClockConfig, displayTypeOverride?: ClockDisplayType): LiveClockData => {
  const effectiveDisplayType = displayTypeOverride ?? config.displayType;
    
  const [rawDate, setRawDate] = useState(new Date());

  // Set up the interval to update the time every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setRawDate(new Date());
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  // Use useMemo to recalculate formatted time only when rawDate or config changes
  const clockData = useMemo(() => {
    
    // Get the current time adjusted to the target timezone's rules.
    const timezoneAdjustedDate = new Date(
        rawDate.toLocaleString('en-US', { timeZone: config.timezone })
    );

    let timeFormatOptions: Intl.DateTimeFormatOptions;
    let dateFormatOptions: Intl.DateTimeFormatOptions;
    let timeString: string;
    let dateString: string;

    if (effectiveDisplayType === 'digital') {
        // Default Digital: 24-hour time, detailed seconds
        timeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: config.timezone,
        };
        dateFormatOptions = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            timeZone: config.timezone,
        };
        
    } else { // 'analog' style (simulated traditional look)
        // Traditional/Analog style: 12-hour time, AM/PM, no seconds in main display
        timeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: config.timezone,
        };
        dateFormatOptions = {
            month: 'long',
            year: 'numeric',
            day: 'numeric',
            timeZone: config.timezone,
        };
    }
    
    // Use Intl for reliable formatting based on options
    timeString = timezoneAdjustedDate.toLocaleTimeString('en-US', timeFormatOptions);
    dateString = timezoneAdjustedDate.toLocaleDateString('en-US', dateFormatOptions);

    return {
      time: timeString,
      date: dateString,
      rawDate: timezoneAdjustedDate,
      formatOptions: timeFormatOptions, // Included for debugging/extensibility
    };
  }, [rawDate, config, effectiveDisplayType]);

  return clockData;
};