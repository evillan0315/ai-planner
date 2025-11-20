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
 *
 * It respects the ClockConfig's `format24Hr` setting for digital clocks.
 */
export const useLiveClock = (
  config: ClockConfig,
  displayTypeOverride?: ClockDisplayType,
): LiveClockData => {
  // Analog override is used by ClockAnalog.tsx to force 12hr display,
  // but if digital is requested, we respect the config format preference.
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
      rawDate.toLocaleString('en-US', { timeZone: config.timezone }),
    );

    let timeFormatOptions: Intl.DateTimeFormatOptions;
    let dateFormatOptions: Intl.DateTimeFormatOptions;

    // Determine 12hr/24hr preference. Default to 12hr if not specified (config.format24Hr is false/undefined).
    // hour12: true => 12-hour clock (e.g., 5:30 PM)
    // hour12: false => 24-hour clock (e.g., 17:30)
    const is12HourFormat = effectiveDisplayType === 'analog' || config.format24Hr !== true;
    
    // Determine if seconds should be displayed. Only digital includes seconds.
    const includeSeconds = effectiveDisplayType === 'digital';
    
    // --- Time Formatting ---
    timeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        ...(includeSeconds && { second: '2-digit' }),
        hour12: is12HourFormat,
        timeZone: config.timezone,
    };


    // --- Date Formatting ---
    if (effectiveDisplayType === 'digital') {
      dateFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: config.timezone,
      };
    } else {
      // 'analog' style (simulated traditional look)
      dateFormatOptions = {
        month: 'long',
        year: 'numeric',
        day: 'numeric',
        timeZone: config.timezone,
      };
    }

    // Use Intl for reliable formatting based on options
    // Using 'en-US' locale for consistent output structure (e.g., AM/PM placement if used)
    const timeString = timezoneAdjustedDate.toLocaleTimeString(
      'en-US',
      timeFormatOptions,
    );
    const dateString = timezoneAdjustedDate.toLocaleDateString(
      'en-US',
      dateFormatOptions,
    );

    return {
      time: timeString,
      date: dateString,
      rawDate: timezoneAdjustedDate,
      formatOptions: timeFormatOptions, // Included for debugging/extensibility
    };
  }, [rawDate, config, effectiveDisplayType]);

  return clockData;
};