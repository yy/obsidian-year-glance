import { ResolvedData, EventMap, WeekStart, DayEventInfo, dateToKey } from '../types';
import { TooltipManager } from '../tooltip';
import { getMonthName, getWeekdayName, getFirstDayOfMonth, getDaysInMonth } from './base';

/**
 * Represents an event segment within a single week
 */
interface EventSegment {
  event: DayEventInfo;
  startCol: number;  // 0-6
  endCol: number;    // 0-6
  weekRow: number;   // which week row (0-5)
  isSingleDay: boolean;
}

/**
 * Get date key for comparison
 */
function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${month}-${day}`;
}

/**
 * Render a month in expanded mode with floating event overlays
 */
export function renderExpandedMonth(
  container: HTMLElement,
  year: number,
  month: number,
  weekStart: WeekStart,
  eventMap: EventMap,
  tooltipManager: TooltipManager,
  todayKey: string | null = null
): void {
  const monthEl = container.createEl('div', { cls: 'year-glance-month year-glance-month--expanded' });

  // Month header
  monthEl.createEl('div', {
    cls: 'year-glance-month-header',
    text: getMonthName(month),
  });

  // Weekday headers
  const weekdayRow = monthEl.createEl('div', { cls: 'year-glance-weekdays' });
  const weekdayOrder = getWeekdayOrder(weekStart);
  for (const day of weekdayOrder) {
    weekdayRow.createEl('div', {
      cls: 'year-glance-weekday',
      text: getWeekdayName(day),
    });
  }

  // Calculate grid structure
  const firstDayOfWeek = getFirstDayOfMonth(year, month);
  const offset = calculateOffset(firstDayOfWeek, weekStart);
  const daysInMonth = getDaysInMonth(year, month);
  const totalCells = offset + daysInMonth;
  const numWeeks = Math.ceil(totalCells / 7);

  // Collect and segment events for this month
  const segments = collectEventSegments(year, month, offset, weekStart, eventMap);

  // Assign vertical slots to avoid overlaps
  const slotAssignments = assignEventSlots(segments, numWeeks);

  // Group events by week row
  const eventsByWeek: Map<number, Array<{ segment: EventSegment; slot: number }>> = new Map();
  for (const assignment of slotAssignments) {
    const week = assignment.segment.weekRow;
    if (!eventsByWeek.has(week)) {
      eventsByWeek.set(week, []);
    }
    eventsByWeek.get(week)!.push(assignment);
  }

  // Calendar body
  const calendarBody = monthEl.createEl('div', { cls: 'year-glance-calendar-body' });

  // Render week by week
  let dayCounter = 1 - offset; // Start before month if there's offset

  for (let week = 0; week < numWeeks; week++) {
    const weekEvents = eventsByWeek.get(week) || [];
    const maxSlot = weekEvents.length > 0
      ? Math.max(...weekEvents.map(e => e.slot)) + 1
      : 0;

    const weekRow = calendarBody.createEl('div', { cls: 'year-glance-week-row' });

    // Day numbers row
    const daysRow = weekRow.createEl('div', { cls: 'year-glance-week-days' });

    for (let col = 0; col < 7; col++) {
      const dayEl = daysRow.createEl('div', { cls: 'year-glance-day year-glance-day--expanded' });

      if (dayCounter >= 1 && dayCounter <= daysInMonth) {
        // Check if this is today
        if (todayKey !== null && getDateKey(year, month, dayCounter) === todayKey) {
          dayEl.addClass('year-glance-day--today');
        }

        dayEl.createEl('span', {
          cls: 'year-glance-day-number',
          text: String(dayCounter),
        });
      } else {
        dayEl.addClass('year-glance-day-empty');
      }
      dayCounter++;
    }

    // Events container for this week (if any events)
    if (weekEvents.length > 0) {
      const eventsContainer = weekRow.createEl('div', { cls: 'year-glance-week-events' });

      // Render each slot layer
      for (let slot = 0; slot < maxSlot; slot++) {
        const slotRow = eventsContainer.createEl('div', { cls: 'year-glance-event-slot' });

        // Find events in this slot
        const slotEvents = weekEvents.filter(e => e.slot === slot);

        for (const { segment } of slotEvents) {
          renderEventSegment(slotRow, segment, tooltipManager);
        }
      }
    }
  }
}

/**
 * Render a single event segment
 */
function renderEventSegment(
  container: HTMLElement,
  segment: EventSegment,
  tooltipManager: TooltipManager
): void {
  const el = container.createEl('div', {
    cls: segment.isSingleDay ? 'year-glance-event-single' : 'year-glance-event-bar',
  });

  // Position using CSS custom properties
  el.style.setProperty('--start-col', String(segment.startCol));
  el.style.setProperty('--span-cols', String(segment.endCol - segment.startCol + 1));

  if (segment.isSingleDay) {
    // Bullet style for single-day
    const bullet = el.createEl('span', { cls: 'year-glance-event-bullet' });
    bullet.style.backgroundColor = segment.event.category.color;

    el.createEl('span', {
      cls: 'year-glance-event-text',
      text: segment.event.event.description,
    });
  } else {
    // Bar style for multi-day
    el.style.backgroundColor = segment.event.category.color;

    if (segment.event.isStart || segment.startCol === 0) {
      el.createEl('span', {
        cls: 'year-glance-event-text',
        text: segment.event.event.description,
      });
    }
  }

  // Tooltip
  el.addEventListener('mouseenter', () => {
    tooltipManager.show(el, [segment.event]);
  });
  el.addEventListener('mouseleave', () => {
    tooltipManager.hide();
  });
}

/**
 * Collect all event segments for a month
 */
function collectEventSegments(
  year: number,
  month: number,
  offset: number,
  weekStart: WeekStart,
  eventMap: EventMap
): EventSegment[] {
  const segments: EventSegment[] = [];
  const daysInMonth = getDaysInMonth(year, month);
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

      const eventSegments = calculateEventSegments(
        eventInfo, year, month, offset, daysInMonth
      );
      segments.push(...eventSegments);
    }
  }

  return segments;
}

/**
 * Calculate segments for an event (may span multiple weeks)
 */
function calculateEventSegments(
  eventInfo: DayEventInfo,
  year: number,
  month: number,
  offset: number,
  daysInMonth: number
): EventSegment[] {
  const segments: EventSegment[] = [];
  const isSingleDay = eventInfo.event.startDate.getTime() === eventInfo.event.endDate.getTime();

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month, daysInMonth);

  const eventStart = eventInfo.event.startDate < monthStart ? monthStart : eventInfo.event.startDate;
  const eventEnd = eventInfo.event.endDate > monthEnd ? monthEnd : eventInfo.event.endDate;

  const startDay = eventStart.getDate();
  const endDay = eventEnd.getDate();

  const startPos = offset + startDay - 1;
  const endPos = offset + endDay - 1;

  const startWeek = Math.floor(startPos / 7);
  const endWeek = Math.floor(endPos / 7);

  for (let week = startWeek; week <= endWeek; week++) {
    const weekStartPos = week * 7;
    const weekEndPos = weekStartPos + 6;

    const segmentStart = Math.max(startPos, weekStartPos);
    const segmentEnd = Math.min(endPos, weekEndPos);

    segments.push({
      event: eventInfo,
      startCol: segmentStart % 7,
      endCol: segmentEnd % 7,
      weekRow: week,
      isSingleDay,
    });
  }

  return segments;
}

/**
 * Assign vertical slots to event segments to avoid overlaps
 */
function assignEventSlots(
  segments: EventSegment[],
  numWeeks: number
): Array<{ segment: EventSegment; slot: number }> {
  const result: Array<{ segment: EventSegment; slot: number }> = [];

  const sortedSegments = [...segments].sort((a, b) => {
    if (a.weekRow !== b.weekRow) return a.weekRow - b.weekRow;
    return a.startCol - b.startCol;
  });

  for (const segment of sortedSegments) {
    let slot = 0;
    while (true) {
      let slotFree = true;
      for (const existing of result) {
        if (existing.segment.weekRow === segment.weekRow && existing.slot === slot) {
          // Check column overlap
          if (!(segment.endCol < existing.segment.startCol || segment.startCol > existing.segment.endCol)) {
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

function getWeekdayOrder(weekStart: WeekStart): number[] {
  if (weekStart === 'monday') {
    return [1, 2, 3, 4, 5, 6, 0];
  }
  return [0, 1, 2, 3, 4, 5, 6];
}

function calculateOffset(firstDayOfWeek: number, weekStart: WeekStart): number {
  if (weekStart === 'monday') {
    return firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  }
  return firstDayOfWeek;
}
