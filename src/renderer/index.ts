import { LayoutType, ResolvedData, EventMap } from '../types';
import { TooltipManager } from '../tooltip';
import { LayoutRenderer } from './base';
import { Grid3x4Renderer } from './grid-3x4';
import { Rows12Renderer } from './rows-12';

/**
 * Create a renderer for the specified layout type
 */
export function createRenderer(layout: LayoutType): LayoutRenderer {
  switch (layout) {
    case '3x4':
      return new Grid3x4Renderer();
    case '52-rows':
      // TODO: Implement Rows52Renderer
      console.warn('52-rows layout not yet implemented, falling back to 3x4');
      return new Grid3x4Renderer();
    case '12-rows':
      return new Rows12Renderer();
    case 'continuous':
      // TODO: Implement ContinuousRenderer
      console.warn('continuous layout not yet implemented, falling back to 3x4');
      return new Grid3x4Renderer();
    default:
      return new Grid3x4Renderer();
  }
}

/**
 * Render the calendar into the container
 */
export function render(
  container: HTMLElement,
  data: ResolvedData,
  eventMap: EventMap,
  tooltipManager: TooltipManager
): void {
  const renderer = createRenderer(data.config.layout);
  renderer.render(container, data, eventMap, tooltipManager);
}

export { LayoutRenderer } from './base';
export { Grid3x4Renderer } from './grid-3x4';
