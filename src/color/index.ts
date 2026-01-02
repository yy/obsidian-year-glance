import {
  Category,
  ResolvedCategory,
  ParsedData,
  ResolvedData,
  EventMap,
  DayEventInfo,
  dateToKey,
} from '../types';

/**
 * Curated color palette for accessibility and visual distinction
 */
export const COLOR_PALETTE = [
  '#e63946', // red
  '#457b9d', // steel blue
  '#2a9d8f', // teal
  '#e9c46a', // yellow
  '#f4a261', // orange
  '#9c89b8', // purple
  '#a8dadc', // light cyan
  '#264653', // dark teal
  '#d62828', // crimson
  '#588157', // forest green
];

/**
 * Assign colors to categories that don't have explicit colors
 */
export function assignColors(categories: Category[]): ResolvedCategory[] {
  let paletteIndex = 0;

  return categories.map((category) => {
    if (category.color) {
      // Use explicit color
      return {
        ...category,
        color: category.color,
      };
    } else {
      // Assign from palette (cycling if needed)
      const color = COLOR_PALETTE[paletteIndex % COLOR_PALETTE.length];
      paletteIndex++;
      return {
        ...category,
        color,
      };
    }
  });
}

/**
 * Resolve parsed data by assigning colors to all categories
 */
export function resolveData(parsed: ParsedData): ResolvedData {
  return {
    config: parsed.config,
    categories: assignColors(parsed.categories),
  };
}

/**
 * Build an EventMap for efficient day-based lookup
 * Maps date strings (YYYY-MM-DD) to array of events on that day
 */
export function buildEventMap(data: ResolvedData): EventMap {
  const map: EventMap = new Map();

  for (const category of data.categories) {
    for (const event of category.events) {
      // Iterate through each day in the event range
      const current = new Date(event.startDate);
      const end = new Date(event.endDate);

      while (current <= end) {
        const key = dateToKey(current);
        const isStart = current.getTime() === event.startDate.getTime();
        const isEnd = current.getTime() === event.endDate.getTime();
        const isMiddle = !isStart && !isEnd;

        const info: DayEventInfo = {
          category,
          event,
          isStart,
          isEnd,
          isMiddle,
        };

        const existing = map.get(key);
        if (existing) {
          existing.push(info);
        } else {
          map.set(key, [info]);
        }

        // Move to next day
        current.setDate(current.getDate() + 1);
      }
    }
  }

  return map;
}
