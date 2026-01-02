/**
 * Layout type options for the year glance calendar
 */
export type LayoutType = '3x4' | '52-rows' | '12-rows' | 'continuous';

/**
 * Week start day options
 */
export type WeekStart = 'sunday' | 'monday';

/**
 * Display style options
 * - compact: minimal look with colored bars, hover for details
 * - expanded: flexible height cells with event text visible
 */
export type DisplayStyle = 'compact' | 'expanded';

/**
 * Configuration parsed from YAML frontmatter
 */
export interface YearGlanceConfig {
  year: number;
  layout: LayoutType;
  weekStart: WeekStart;
  style: DisplayStyle;
  showToday: boolean;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: YearGlanceConfig = {
  year: new Date().getFullYear(),
  layout: '3x4',
  weekStart: 'sunday',
  style: 'compact',
  showToday: true,
};

/**
 * A calendar event with start/end dates and description
 */
export interface CalendarEvent {
  startDate: Date;
  endDate: Date; // same as startDate for single-day events
  description: string;
}

/**
 * A category grouping events with an optional color
 */
export interface Category {
  name: string;
  color?: string; // hex color, optional (auto-assigned if missing)
  events: CalendarEvent[];
}

/**
 * Category with guaranteed color (after color assignment)
 */
export interface ResolvedCategory extends Omit<Category, 'color'> {
  color: string;
}

/**
 * Result of parsing the code block content
 */
export interface ParsedData {
  config: YearGlanceConfig;
  categories: Category[];
}

/**
 * Resolved data with colors assigned to all categories
 */
export interface ResolvedData {
  config: YearGlanceConfig;
  categories: ResolvedCategory[];
}

/**
 * Parse error with line number for user feedback
 */
export interface ParseError {
  line: number;
  message: string;
}

/**
 * Result of parsing - either success with data or failure with errors
 */
export interface ParseResult {
  success: boolean;
  data?: ParsedData;
  errors: ParseError[];
}

/**
 * Information about an event on a specific day
 */
export interface DayEventInfo {
  category: ResolvedCategory;
  event: CalendarEvent;
  isStart: boolean;
  isEnd: boolean;
  isMiddle: boolean;
}

/**
 * Map from date string (YYYY-MM-DD) to events on that day
 */
export type EventMap = Map<string, DayEventInfo[]>;

/**
 * Convert a Date to the EventMap key format
 */
export function dateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse YYYYMMDD string to Date
 */
export function parseYYYYMMDD(str: string): Date | null {
  if (!/^\d{8}$/.test(str)) {
    return null;
  }
  const year = parseInt(str.slice(0, 4), 10);
  const month = parseInt(str.slice(4, 6), 10) - 1; // 0-indexed
  const day = parseInt(str.slice(6, 8), 10);

  const date = new Date(year, month, day);

  // Validate the date is real (e.g., not Feb 30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

/**
 * Format a date as compact string (e.g., "1/15")
 */
export function formatCompactDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
