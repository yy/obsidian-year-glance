import { ParseResult, ParsedData } from '../types';
import { parseFrontmatter } from './frontmatter';
import { parseEvents } from './events';

/**
 * Parse the complete year_glance code block content
 */
export function parse(content: string): ParseResult {
  // Step 1: Parse frontmatter
  const frontmatterResult = parseFrontmatter(content);

  // Step 2: Extract body content (after frontmatter)
  const lines = content.split('\n');
  const bodyLines = lines.slice(frontmatterResult.bodyStartLine);
  const bodyContent = bodyLines.join('\n');

  // Step 3: Parse events from body
  const eventsResult = parseEvents(bodyContent, frontmatterResult.bodyStartLine);

  // Combine errors
  const errors = [...frontmatterResult.errors, ...eventsResult.errors];

  // If there are critical errors, return failure
  // For now, we allow partial parsing with warnings
  const data: ParsedData = {
    config: frontmatterResult.config,
    categories: eventsResult.categories,
  };

  return {
    success: errors.length === 0,
    data,
    errors,
  };
}

export { parseFrontmatter } from './frontmatter';
export { parseEvents } from './events';
