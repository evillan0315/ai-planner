import { atom } from 'nanostores';
import { ClockConfig, ClockDisplayType } from '@/components/clock/types';

// Simplified list of common timezones for the config UI
export const AvailableTimezones = [
  { value: 'UTC', label: 'UTC' },
  {
    value: Intl.DateTimeFormat().resolvedOptions().timeZone,
    label: 'Local Time',
  },
  { value: 'America/New_York', label: 'New York' }, // DST-aware
  { value: 'Europe/London', label: 'London' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Australia/Sydney', label: 'Sydney' },
];

const DEFAULT_CLOCKS: ClockConfig[] = [
  {
    id: 'local',
    label: 'Local Time',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    displayType: 'digital',
  },
  {
    id: 'ny',
    label: 'New York',
    timezone: 'America/New_York', // uses DST automatically
    displayType: 'digital',
  },
];

export const clockConfigsStore = atom<ClockConfig[]>(DEFAULT_CLOCKS);

// --- Store Actions ---

export const updateClockConfig = (
  id: string,
  updates: Partial<ClockConfig>,
) => {
  clockConfigsStore.set(
    clockConfigsStore
      .get()
      .map((clock) => (clock.id === id ? { ...clock, ...updates } : clock)),
  );
};

export const addClockConfig = (config: ClockConfig) => {
  clockConfigsStore.set([...clockConfigsStore.get(), config]);
};

export const removeClockConfig = (id: string) => {
  clockConfigsStore.set(
    clockConfigsStore.get().filter((clock) => clock.id !== id),
  );
};

export const updateClockDisplayType = (
  id: string,
  displayType: ClockDisplayType,
) => {
  updateClockConfig(id, { displayType });
};

// --- Utility to get current time string in a timezone ---
export const getCurrentTimeInZone = (timezone: string) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
    timeZone: timezone,
  }).format(new Date());
};
