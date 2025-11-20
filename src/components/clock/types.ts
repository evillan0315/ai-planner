export type ClockDisplayType = 'digital' | 'analog';

export interface ClockConfig {
  id: string;
  label: string;
  timezone: string; // IANA Timezone string, e.g., 'America/New_York'
  displayType: ClockDisplayType;
  format24Hr?: boolean; // NEW: true for 24-hour format (digital clocks only)
}