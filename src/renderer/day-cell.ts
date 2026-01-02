import { DayEventInfo, EventMap, dateToKey, DisplayStyle } from '../types';
import { TooltipManager } from '../tooltip';

/**
 * Maximum number of event indicators to display in compact mode
 */
const MAX_COMPACT_INDICATORS = 3;

/**
 * Render a day cell with event indicators
 */
export function renderDayCell(
  container: HTMLElement,
  date: Date,
  eventMap: EventMap,
  tooltipManager: TooltipManager,
  style: DisplayStyle = 'compact',
  isToday: boolean = false
): HTMLElement {
  const key = dateToKey(date);
  const events = eventMap.get(key) || [];
  const dayNum = date.getDate();

  const cell = container.createEl('div', {
    cls: `year-glance-day year-glance-day--${style}`,
  });

  if (isToday) {
    cell.addClass('year-glance-day--today');
  }

  // Day number
  cell.createEl('span', {
    cls: 'year-glance-day-number',
    text: String(dayNum),
  });

  if (events.length > 0) {
    if (style === 'compact') {
      renderCompactEvents(cell, events, tooltipManager);
    } else {
      renderExpandedEvents(cell, events, tooltipManager);
    }
    cell.addClass('has-events');
  }

  return cell;
}

/**
 * Render compact mode: colored bars with hover tooltips
 */
function renderCompactEvents(
  cell: HTMLElement,
  events: DayEventInfo[],
  tooltipManager: TooltipManager
): void {
  const indicators = cell.createEl('div', { cls: 'year-glance-indicators' });

  // Render up to MAX_COMPACT_INDICATORS
  const visibleEvents = events.slice(0, MAX_COMPACT_INDICATORS);
  for (const eventInfo of visibleEvents) {
    const indicator = indicators.createEl('div', {
      cls: 'year-glance-indicator',
    });
    indicator.style.backgroundColor = eventInfo.category.color;

    // Add position classes for multi-day events
    if (eventInfo.isStart) {
      indicator.addClass('indicator-start');
    }
    if (eventInfo.isEnd) {
      indicator.addClass('indicator-end');
    }
    if (eventInfo.isMiddle) {
      indicator.addClass('indicator-middle');
    }
  }

  // Show overflow indicator if more events
  if (events.length > MAX_COMPACT_INDICATORS) {
    indicators.createEl('div', {
      cls: 'year-glance-indicator-overflow',
      text: `+${events.length - MAX_COMPACT_INDICATORS}`,
    });
  }

  // Attach tooltip handlers
  cell.addEventListener('mouseenter', () => {
    tooltipManager.show(cell, events);
  });

  cell.addEventListener('mouseleave', () => {
    tooltipManager.hide();
  });
}

/**
 * Render expanded mode: full event text visible
 */
function renderExpandedEvents(
  cell: HTMLElement,
  events: DayEventInfo[],
  tooltipManager: TooltipManager
): void {
  const eventsContainer = cell.createEl('div', { cls: 'year-glance-events' });

  for (const eventInfo of events) {
    const eventEl = eventsContainer.createEl('div', {
      cls: 'year-glance-event',
    });
    eventEl.style.backgroundColor = eventInfo.category.color;

    // Add position classes for multi-day events
    if (eventInfo.isStart) {
      eventEl.addClass('event-start');
    }
    if (eventInfo.isEnd) {
      eventEl.addClass('event-end');
    }
    if (eventInfo.isMiddle) {
      eventEl.addClass('event-middle');
    }

    // Show text only on start day (or single-day events)
    if (eventInfo.isStart || (!eventInfo.isMiddle && !eventInfo.isEnd)) {
      eventEl.createEl('span', {
        cls: 'year-glance-event-text',
        text: eventInfo.event.description,
      });
    }
  }

  // Still attach tooltip for additional details
  cell.addEventListener('mouseenter', () => {
    tooltipManager.show(cell, events);
  });

  cell.addEventListener('mouseleave', () => {
    tooltipManager.hide();
  });
}

/**
 * Render an empty placeholder cell (for padding before month starts)
 */
export function renderEmptyCell(
  container: HTMLElement,
  style: DisplayStyle = 'compact'
): HTMLElement {
  return container.createEl('div', {
    cls: `year-glance-day year-glance-day-empty year-glance-day--${style}`,
  });
}
