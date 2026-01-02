import { DayEventInfo, formatCompactDate } from '../types';

/**
 * Manages a single tooltip element for hover interactions
 */
export class TooltipManager {
  private tooltip: HTMLElement | null = null;
  private hideTimeout: number | null = null;

  /**
   * Create the tooltip element (called once during plugin load)
   */
  create(): void {
    if (this.tooltip) return;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'year-glance-tooltip';
    this.tooltip.style.display = 'none';
    document.body.appendChild(this.tooltip);
  }

  /**
   * Show the tooltip near the target element with event information
   */
  show(target: HTMLElement, events: DayEventInfo[]): void {
    if (!this.tooltip) return;

    // Clear any pending hide
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Build tooltip content
    this.tooltip.empty();

    for (const eventInfo of events) {
      const item = this.tooltip.createEl('div', { cls: 'tooltip-item' });

      // Color indicator
      const dot = item.createEl('span', { cls: 'tooltip-dot' });
      dot.style.backgroundColor = eventInfo.category.color;

      // Date range
      const dateStr = this.formatDateRange(eventInfo);
      item.createEl('span', {
        cls: 'tooltip-date',
        text: dateStr,
      });

      // Description
      item.createEl('span', {
        cls: 'tooltip-desc',
        text: eventInfo.event.description,
      });
    }

    // Position tooltip
    this.position(target);

    // Show
    this.tooltip.style.display = 'block';
  }

  /**
   * Hide the tooltip (with small delay to prevent flicker)
   */
  hide(): void {
    if (!this.tooltip) return;

    this.hideTimeout = window.setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.style.display = 'none';
      }
    }, 100);
  }

  /**
   * Clean up the tooltip element
   */
  destroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  /**
   * Format date range for display
   */
  private formatDateRange(eventInfo: DayEventInfo): string {
    const start = formatCompactDate(eventInfo.event.startDate);
    const end = formatCompactDate(eventInfo.event.endDate);

    if (start === end) {
      return start;
    }
    return `${start} - ${end}`;
  }

  /**
   * Position tooltip near target element
   */
  private position(target: HTMLElement): void {
    if (!this.tooltip) return;

    const rect = target.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const padding = 8;

    // Try to position below the target
    let top = rect.bottom + padding;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

    // Check if tooltip would go off-screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position
    if (left < padding) {
      left = padding;
    } else if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }

    // If tooltip would go below viewport, show above target
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = rect.top - tooltipRect.height - padding;
    }

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
  }
}
