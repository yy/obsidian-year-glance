import { ResolvedData, EventMap, dateToKey, DayEventInfo, WeekStart } from '../types';
import { TooltipManager } from '../tooltip';
import { LayoutRenderer, getDaysInMonth, getFirstDayOfMonth } from './base';

/**
 * Get month number as string (1-12)
 */
function getMonthNumber(month: number): string {
  return String(month + 1);
}

/**
 * Event segment for 12-rows layout (week-aligned)
 */
interface EventSegment12 {
  event: DayEventInfo;
  startCol: number;  // absolute column position
  endCol: number;    // absolute column position
  isSingleDay: boolean;
}

/**
 * 12-Rows Layout Renderer
 * Displays 12 months as rows, each showing all days horizontally
 * Days are aligned by day-of-week with vertical week separators
 */
export class Rows12Renderer implements LayoutRenderer {
  render(
    container: HTMLElement,
    data: ResolvedData,
    eventMap: EventMap,
    tooltipManager: TooltipManager
  ): void {
    const { year, style, weekStart, showToday } = data.config;

    // Get today's date for comparison
    const today = new Date();
    const todayKey = showToday ? this.getDateKey(today) : null;

    const wrapper = container.createEl('div', {
      cls: `year-glance year-glance--12-rows year-glance--${style}`,
    });

    // Year header
    wrapper.createEl('div', {
      cls: 'year-glance-header',
      text: String(year),
    });

    // Weekday header row (S M T W T F S × num weeks)
    this.renderWeekdayHeader(wrapper, weekStart);

    // Container for all month rows
    const rowsContainer = wrapper.createEl('div', { cls: 'year-glance-rows' });

    // Render each month as a row
    for (let month = 0; month < 12; month++) {
      if (style === 'expanded') {
        this.renderMonthRowExpanded(rowsContainer, year, month, weekStart, eventMap, tooltipManager, todayKey);
      } else {
        this.renderMonthRowCompact(rowsContainer, year, month, weekStart, eventMap, tooltipManager, todayKey);
      }
    }
  }

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /**
   * Render weekday header row
   */
  private renderWeekdayHeader(container: HTMLElement, weekStart: WeekStart): void {
    const headerRow = container.createEl('div', { cls: 'year-glance-12row-header' });

    // Empty space for month label
    headerRow.createEl('div', { cls: 'year-glance-month-label' });

    // Weekday initials with weekend markers
    // isWeekend array: true if that position is Sat/Sun
    const weekdays = weekStart === 'monday'
      ? [
          { initial: 'M', isWeekend: false },
          { initial: 'T', isWeekend: false },
          { initial: 'W', isWeekend: false },
          { initial: 'T', isWeekend: false },
          { initial: 'F', isWeekend: false },
          { initial: 'S', isWeekend: true },
          { initial: 'S', isWeekend: true },
        ]
      : [
          { initial: 'S', isWeekend: true },
          { initial: 'M', isWeekend: false },
          { initial: 'T', isWeekend: false },
          { initial: 'W', isWeekend: false },
          { initial: 'T', isWeekend: false },
          { initial: 'F', isWeekend: false },
          { initial: 'S', isWeekend: true },
        ];

    const daysContainer = headerRow.createEl('div', { cls: 'year-glance-12row-weekday-headers' });

    for (let week = 0; week < 6; week++) {
      const weekBlock = daysContainer.createEl('div', { cls: 'year-glance-12row-week-block' });

      for (const { initial, isWeekend } of weekdays) {
        const dayEl = weekBlock.createEl('div', {
          cls: 'year-glance-12row-weekday',
          text: initial,
        });
        if (isWeekend) {
          dayEl.addClass('year-glance-12row-weekday--weekend');
        }
      }
    }
  }

  /**
   * Calculate offset for day-of-week alignment
   */
  private calculateOffset(firstDayOfWeek: number, weekStart: WeekStart): number {
    if (weekStart === 'monday') {
      return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    }
    return firstDayOfWeek;
  }

  /**
   * Check if a position in the week is a weekend
   */
  private isWeekendPosition(dayOfWeek: number, weekStart: WeekStart): boolean {
    if (weekStart === 'monday') {
      // Mon=0, Tue=1, ..., Sat=5, Sun=6
      return dayOfWeek === 5 || dayOfWeek === 6;
    }
    // Sun=0, Mon=1, ..., Fri=5, Sat=6
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Compact mode: small indicators, aligned by day-of-week
   */
  private renderMonthRowCompact(
    container: HTMLElement,
    year: number,
    month: number,
    weekStart: WeekStart,
    eventMap: EventMap,
    tooltipManager: TooltipManager,
    todayKey: string | null
  ): void {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const offset = this.calculateOffset(firstDay, weekStart);
    const totalCells = offset + daysInMonth;
    const numWeeks = Math.ceil(totalCells / 7);

    const row = container.createEl('div', { cls: 'year-glance-month-row' });

    // Month label (number)
    row.createEl('div', {
      cls: 'year-glance-month-label',
      text: getMonthNumber(month),
    });

    // Days container with week blocks
    const daysContainer = row.createEl('div', { cls: 'year-glance-month-days year-glance-month-days--aligned' });

    let dayNum = 1;

    for (let week = 0; week < numWeeks; week++) {
      const weekBlock = daysContainer.createEl('div', { cls: 'year-glance-week-block' });

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellIndex = week * 7 + dayOfWeek;
        const isValidDay = cellIndex >= offset && dayNum <= daysInMonth;
        const isWeekend = this.isWeekendPosition(dayOfWeek, weekStart);
        const isToday = isValidDay && todayKey !== null && `${year}-${month}-${dayNum}` === todayKey;

        const dayEl = weekBlock.createEl('div', { cls: 'year-glance-row-day' });
        if (isWeekend) {
          dayEl.addClass('year-glance-row-day--weekend');
        }
        if (isToday) {
          dayEl.addClass('year-glance-row-day--today');
        }

        if (isValidDay) {
          const date = new Date(year, month, dayNum);
          const key = dateToKey(date);
          const events = eventMap.get(key) || [];

          dayEl.createEl('span', {
            cls: 'year-glance-row-day-number',
            text: String(dayNum),
          });

          if (events.length > 0) {
            dayEl.addClass('has-events');

            const indicatorContainer = dayEl.createEl('div', { cls: 'year-glance-row-indicators' });

            const maxIndicators = Math.min(events.length, 3);
            for (let i = 0; i < maxIndicators; i++) {
              const indicator = indicatorContainer.createEl('div', { cls: 'year-glance-row-indicator' });
              indicator.style.backgroundColor = events[i].category.color;
            }

            dayEl.addEventListener('mouseenter', () => {
              tooltipManager.show(dayEl, events);
            });
            dayEl.addEventListener('mouseleave', () => {
              tooltipManager.hide();
            });
          }

          dayNum++;
        } else {
          dayEl.addClass('year-glance-row-day-empty');
        }
      }
    }
  }

  /**
   * Expanded mode: floating event bars with text, aligned by day-of-week
   */
  private renderMonthRowExpanded(
    container: HTMLElement,
    year: number,
    month: number,
    weekStart: WeekStart,
    eventMap: EventMap,
    tooltipManager: TooltipManager,
    todayKey: string | null
  ): void {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const offset = this.calculateOffset(firstDay, weekStart);
    const totalCells = offset + daysInMonth;
    const numWeeks = Math.ceil(totalCells / 7);

    const row = container.createEl('div', { cls: 'year-glance-month-row year-glance-month-row--expanded' });

    // Month label (number)
    row.createEl('div', {
      cls: 'year-glance-month-label year-glance-month-label--expanded',
      text: getMonthNumber(month),
    });

    // Content area (days + events)
    const contentArea = row.createEl('div', { cls: 'year-glance-12row-content' });

    // Days row with week blocks
    const daysRow = contentArea.createEl('div', { cls: 'year-glance-12row-days year-glance-12row-days--aligned' });

    let dayNum = 1;

    for (let week = 0; week < numWeeks; week++) {
      const weekBlock = daysRow.createEl('div', { cls: 'year-glance-12row-week-block' });

      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const cellIndex = week * 7 + dayOfWeek;
        const isValidDay = cellIndex >= offset && dayNum <= daysInMonth;
        const isWeekend = this.isWeekendPosition(dayOfWeek, weekStart);
        const isToday = isValidDay && todayKey !== null && `${year}-${month}-${dayNum}` === todayKey;

        const dayEl = weekBlock.createEl('div', { cls: 'year-glance-12row-day' });
        if (isWeekend) {
          dayEl.addClass('year-glance-12row-day--weekend');
        }
        if (isToday) {
          dayEl.addClass('year-glance-12row-day--today');
        }

        if (isValidDay) {
          dayEl.createEl('span', {
            cls: 'year-glance-12row-day-number',
            text: String(dayNum),
          });
          dayNum++;
        } else {
          dayEl.addClass('year-glance-12row-day-empty');
        }
      }
    }

    // Collect event segments for this month
    const segments = this.collectEventSegments(year, month, daysInMonth, offset, eventMap);
    const totalCols = numWeeks * 7;

    // Assign slots to avoid overlaps (with text space for single-day events)
    const slotAssignments = this.assignSlots(segments, totalCols);

    if (slotAssignments.length > 0) {
      const maxSlot = Math.max(...slotAssignments.map(a => a.slot)) + 1;

      const eventsContainer = contentArea.createEl('div', { cls: 'year-glance-12row-events year-glance-12row-events--aligned' });
      eventsContainer.style.setProperty('--num-weeks', String(numWeeks));

      for (let slot = 0; slot < maxSlot; slot++) {
        const slotRow = eventsContainer.createEl('div', { cls: 'year-glance-12row-event-slot' });

        // Sort events in this slot by start column
        const slotEvents = slotAssignments
          .filter(a => a.slot === slot)
          .sort((a, b) => a.segment.startCol - b.segment.startCol);

        for (let i = 0; i < slotEvents.length; i++) {
          const { segment } = slotEvents[i];
          // Calculate available end column (next event's start, or row end)
          const nextEvent = slotEvents[i + 1];
          const availableEndCol = nextEvent ? nextEvent.segment.startCol : totalCols;
          this.renderEventSegment(slotRow, segment, numWeeks, tooltipManager, availableEndCol);
        }
      }
    }
  }

  /**
   * Collect event segments for a month (with offset for alignment)
   */
  private collectEventSegments(
    year: number,
    month: number,
    daysInMonth: number,
    offset: number,
    eventMap: EventMap
  ): EventSegment12[] {
    const segments: EventSegment12[] = [];
    const processedEvents = new Set<string>();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = dateToKey(date);
      const events = eventMap.get(key) || [];

      for (const eventInfo of events) {
        const eventId = `${eventInfo.event.description}-${eventInfo.event.startDate.getTime()}`;
        if (processedEvents.has(eventId)) continue;
        if (!eventInfo.isStart && day !== 1) continue;
        processedEvents.add(eventId);

        const segment = this.calculateEventSegment(eventInfo, year, month, daysInMonth, offset);
        segments.push(segment);
      }
    }

    return segments;
  }

  /**
   * Calculate segment for an event within this month (with offset)
   */
  private calculateEventSegment(
    eventInfo: DayEventInfo,
    year: number,
    month: number,
    daysInMonth: number,
    offset: number
  ): EventSegment12 {
    const isSingleDay = eventInfo.event.startDate.getTime() === eventInfo.event.endDate.getTime();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month, daysInMonth);

    const eventStart = eventInfo.event.startDate < monthStart ? monthStart : eventInfo.event.startDate;
    const eventEnd = eventInfo.event.endDate > monthEnd ? monthEnd : eventInfo.event.endDate;

    // Columns are offset-adjusted: day 1 is at column `offset`
    const startCol = offset + eventStart.getDate() - 1;
    const endCol = offset + eventEnd.getDate() - 1;

    return {
      event: eventInfo,
      startCol,
      endCol,
      isSingleDay,
    };
  }

  /**
   * Get effective end column for overlap detection
   * Single-day events need extra space for their text
   */
  private getEffectiveEndCol(segment: EventSegment12, totalCols: number): number {
    if (segment.isSingleDay) {
      // Single-day events need ~8 columns of space for text display
      return Math.min(segment.startCol + 8, totalCols - 1);
    }
    return segment.endCol;
  }

  /**
   * Assign slots to avoid overlapping events
   */
  private assignSlots(segments: EventSegment12[], totalCols: number): Array<{ segment: EventSegment12; slot: number }> {
    const result: Array<{ segment: EventSegment12; slot: number }> = [];

    const sorted = [...segments].sort((a, b) => a.startCol - b.startCol);

    for (const segment of sorted) {
      const effectiveEnd = this.getEffectiveEndCol(segment, totalCols);
      let slot = 0;
      while (true) {
        let slotFree = true;
        for (const existing of result) {
          if (existing.slot === slot) {
            const existingEffectiveEnd = this.getEffectiveEndCol(existing.segment, totalCols);
            // Check if effective ranges overlap
            if (!(effectiveEnd < existing.segment.startCol || segment.startCol > existingEffectiveEnd)) {
              slotFree = false;
              break;
            }
          }
        }
        if (slotFree) break;
        slot++;
      }
      result.push({ segment, slot });
    }

    return result;
  }

  /**
   * Render an event segment (aligned mode)
   * @param availableEndCol - For single-day events, the column where the next event starts (or row end)
   */
  private renderEventSegment(
    container: HTMLElement,
    segment: EventSegment12,
    numWeeks: number,
    tooltipManager: TooltipManager,
    availableEndCol: number
  ): void {
    const el = container.createEl('div', {
      cls: segment.isSingleDay ? 'year-glance-12row-event-single' : 'year-glance-12row-event-bar',
    });

    // Calculate pixel positions accounting for week separators
    const colWidth = 16; // px
    const weekGap = 1;   // px (border width)

    const startWeek = Math.floor(segment.startCol / 7);

    // Left position: column * width + week borders crossed
    const left = segment.startCol * colWidth + startWeek * weekGap;

    if (segment.isSingleDay) {
      // For single-day events, extend width to available space (until next event or row end)
      const endWeek = Math.floor((availableEndCol - 1) / 7);
      const weeksCrossed = endWeek - startWeek;
      const spanCols = availableEndCol - segment.startCol;
      const width = spanCols * colWidth + weeksCrossed * weekGap - 4; // -4 for padding

      el.style.left = `${left}px`;
      el.style.width = `${width}px`;

      const bullet = el.createEl('span', { cls: 'year-glance-12row-event-bullet' });
      bullet.style.backgroundColor = segment.event.category.color;

      el.createEl('span', {
        cls: 'year-glance-12row-event-text',
        text: segment.event.event.description,
      });
    } else {
      // Multi-day bar: use actual event span
      const endWeek = Math.floor(segment.endCol / 7);
      const weeksCrossed = endWeek - startWeek;
      const spanCols = segment.endCol - segment.startCol + 1;
      const width = spanCols * colWidth + weeksCrossed * weekGap - 2;

      el.style.left = `${left}px`;
      el.style.width = `${width}px`;
      el.style.backgroundColor = segment.event.category.color;

      el.createEl('span', {
        cls: 'year-glance-12row-event-text',
        text: segment.event.event.description,
      });
    }

    el.addEventListener('mouseenter', () => {
      tooltipManager.show(el, [segment.event]);
    });
    el.addEventListener('mouseleave', () => {
      tooltipManager.hide();
    });
  }
}
