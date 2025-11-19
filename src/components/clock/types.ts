export type ClockDisplayType = 'digital' | 'analog';

export interface ClockConfig {
  id: string;
  label: string;
  timezone: string; // IANA Timezone string, e.g., 'America/New_York'
  displayType: ClockDisplayType;
}