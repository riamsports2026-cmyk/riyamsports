/** Convert value + unit to minutes (used for DB storage). */
export function valueToMinutes(value: number, unit: string): number {
  if (value <= 0) return 0;
  switch (unit) {
    case 'day':
      return Math.round(value * 1440);
    case 'hour':
      return Math.round(value * 60);
    case 'min':
    default:
      return Math.round(value);
  }
}

/** Convert stored minutes to best display unit and value for editing. */
export function minutesToValueAndUnit(minutes: number): { value: number; unit: string } {
  if (minutes >= 1440 && minutes % 1440 === 0) return { value: minutes / 1440, unit: 'day' };
  if (minutes >= 60 && minutes % 60 === 0) return { value: minutes / 60, unit: 'hour' };
  return { value: minutes, unit: 'min' };
}
