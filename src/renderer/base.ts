import { ResolvedData, EventMap, LayoutType } from '../types';
import { TooltipManager } from '../tooltip';

/**
 * Interface for layout renderers
 */
export interface LayoutRenderer {
  render(
    container: HTMLElement,
    data: ResolvedData,
    eventMap: EventMap,
    tooltipManager: TooltipManager
  ): void;
}

/**
 * Get month name abbreviation
 */
export function getMonthName(month: number): string {
  const names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return names[month];
}

/**
 * Get weekday abbreviation
 */
export function getWeekdayName(day: number, short = true): string {
  const names = short
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return names[day];
}

/**
 * Get the day of week for the first day of a month
 * 0 = Sunday, 1 = Monday, etc.
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get total days in a year
 */
export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}
