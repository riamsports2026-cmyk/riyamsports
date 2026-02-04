/**
 * Convert 24-hour format to 12-hour format with am/pm
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour < 12) return `${hour}am`;
  if (hour === 12) return '12pm';
  return `${hour - 12}pm`;
}

/**
 * Group consecutive hours into ranges
 * Example: [18, 19, 20] -> [[18, 20]]
 * Example: [18, 19, 21, 22] -> [[18, 19], [21, 22]]
 */
function groupConsecutiveHours(hours: number[]): number[][] {
  if (hours.length === 0) return [];
  
  const sorted = [...hours].sort((a, b) => a - b);
  const groups: number[][] = [];
  let currentGroup: number[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      // Consecutive hour, add to current group
      currentGroup.push(sorted[i]);
    } else {
      // Non-consecutive, start new group
      groups.push(currentGroup);
      currentGroup = [sorted[i]];
    }
  }
  groups.push(currentGroup);
  
  return groups;
}

/**
 * Format booking time slots as ranges in 12-hour format with am/pm
 * Example: [18, 19] -> "6pm to 7pm"
 * Example: [18, 19, 20] -> "6pm to 9pm"
 * Example: [18, 19, 21, 22] -> "6pm to 8pm, 9pm to 11pm"
 */
export function formatTimeSlots(slots: { hour: number }[] | number[]): string {
  if (!slots || slots.length === 0) return '';

  // Extract hours if slots are objects
  const hours = slots.map((slot: any) => 
    typeof slot === 'number' ? slot : slot.hour
  );

  if (hours.length === 0) return '';

  // Group consecutive hours
  const groups = groupConsecutiveHours(hours);

  // Format each group
  return groups.map((group) => {
    if (group.length === 1) {
      // Single hour: show as "6pm to 7pm" (hour to hour+1)
      const start = formatHour(group[0]);
      const endHour = (group[0] + 1) % 24; // Next hour, wrap around at 24
      const end = formatHour(endHour);
      return `${start} to ${end}`;
    } else {
      // Range: start to end+1 (e.g., [18, 19, 20] = 6pm to 9pm)
      const start = formatHour(group[0]);
      const lastHour = group[group.length - 1];
      const endHour = (lastHour + 1) % 24; // Next hour after last booked hour
      const end = formatHour(endHour);
      return `${start} to ${end}`;
    }
  }).join(', ');
}

