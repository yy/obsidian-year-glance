import { ResolvedData, EventMap, WeekStart, DisplayStyle } from '../types';
import { TooltipManager } from '../tooltip';
import {
  LayoutRenderer,
  getMonthName,
  getWeekdayName,
  getFirstDayOfMonth,
  getDaysInMonth,
} from './base';
import { renderDayCell, renderEmptyCell } from './day-cell';
import { renderExpandedMonth } from './expanded-month';

/**
 * 3x4 Grid Layout Renderer
 * Displays 12 months in a 3-column, 4-row grid
 */
export class Grid3x4Renderer implements LayoutRenderer {
  render(
    container: HTMLElement,
    data: ResolvedData,
    eventMap: EventMap,
    tooltipManager: TooltipManager
  ): void {
    const { year, weekStart, style, showToday } = data.config;

    // Get today's date for comparison
    const today = new Date();
    const todayKey = showToday ? this.getDateKey(today) : null;

    // Create main container with style modifier
    const wrapper = container.createEl('div', {
      cls: `year-glance year-glance--3x4 year-glance--${style}`,
    });

    // Year header
    wrapper.createEl('div', {
      cls: 'year-glance-header',
      text: String(year),
    });

    // Month grid (3x4)
    const grid = wrapper.createEl('div', { cls: 'year-glance-grid' });

    for (let month = 0; month < 12; month++) {
      if (style === 'expanded') {
        renderExpandedMonth(grid, year, month, weekStart, eventMap, tooltipManager, todayKey);
      } else {
        this.renderMonth(grid, year, month, weekStart, style, eventMap, tooltipManager, todayKey);
      }
    }
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private renderMonth(
    container: HTMLElement,
    year: number,
    month: number,
    weekStart: WeekStart,
    style: DisplayStyle,
    eventMap: EventMap,
    tooltipManager: TooltipManager,
    todayKey: string | null
  ): void {
    const monthEl = container.createEl('div', { cls: 'year-glance-month' });

    // Month header
    monthEl.createEl('div', {
      cls: 'year-glance-month-header',
      text: getMonthName(month),
    });

    // Weekday headers
    const weekdayRow = monthEl.createEl('div', { cls: 'year-glance-weekdays' });
    const weekdayOrder = this.getWeekdayOrder(weekStart);
    for (const day of weekdayOrder) {
      weekdayRow.createEl('div', {
        cls: 'year-glance-weekday',
        text: getWeekdayName(day),
      });
    }

    // Days grid
    const daysGrid = monthEl.createEl('div', { cls: 'year-glance-days' });

    // Calculate offset for first day
    const firstDayOfWeek = getFirstDayOfMonth(year, month);
    const offset = this.calculateOffset(firstDayOfWeek, weekStart);

    // Empty cells for offset
    for (let i = 0; i < offset; i++) {
      renderEmptyCell(daysGrid, style);
    }

    // Day cells
    const daysInMonth = getDaysInMonth(year, month);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = todayKey !== null && this.getDateKey(date) === todayKey;
      renderDayCell(daysGrid, date, eventMap, tooltipManager, style, isToday);
    }
  }

  /**
   * Get weekday order based on week start preference
   */
  private getWeekdayOrder(weekStart: WeekStart): number[] {
    if (weekStart === 'monday') {
      return [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun
    }
    return [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat
  }

  /**
   * Calculate offset for first day of month
   */
  private calculateOffset(firstDayOfWeek: number, weekStart: WeekStart): number {
    if (weekStart === 'monday') {
      // If week starts on Monday, Sunday (0) becomes 6, Monday (1) becomes 0, etc.
      return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    }
    return firstDayOfWeek;
  }
}
