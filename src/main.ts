import { Plugin } from 'obsidian';
import { parse } from './parser';
import { resolveData, buildEventMap } from './color';
import { render } from './renderer';
import { TooltipManager } from './tooltip';

export default class YearGlancePlugin extends Plugin {
  private tooltipManager: TooltipManager;

  async onload() {
    console.log('Loading Year Glance plugin');

    // Create tooltip manager
    this.tooltipManager = new TooltipManager();
    this.tooltipManager.create();

    // Register the year_glance code block processor
    this.registerMarkdownCodeBlockProcessor(
      'year_glance',
      (source, el, ctx) => {
        this.processYearGlance(source, el);
      }
    );
  }

  async onunload() {
    console.log('Unloading Year Glance plugin');
    this.tooltipManager.destroy();
  }

  private processYearGlance(source: string, container: HTMLElement): void {
    // Step 1: Parse the content
    const parseResult = parse(source);

    // Step 2: Handle errors
    if (parseResult.errors.length > 0) {
      this.renderErrors(container, parseResult.errors);

      // If no data, stop here
      if (!parseResult.data) {
        return;
      }
    }

    // Step 3: Resolve colors
    const resolvedData = resolveData(parseResult.data!);

    // Step 4: Build event map for efficient lookup
    const eventMap = buildEventMap(resolvedData);

    // Step 5: Render the calendar
    render(container, resolvedData, eventMap, this.tooltipManager);
  }

  private renderErrors(
    container: HTMLElement,
    errors: Array<{ line: number; message: string }>
  ): void {
    const errorContainer = container.createEl('div', {
      cls: 'year-glance-errors',
    });

    for (const error of errors) {
      const errorEl = errorContainer.createEl('div', {
        cls: 'year-glance-error',
      });

      errorEl.createEl('span', {
        cls: 'year-glance-error-line',
        text: `Line ${error.line}: `,
      });

      errorEl.createEl('span', {
        cls: 'year-glance-error-message',
        text: error.message,
      });
    }
  }
}
