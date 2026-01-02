import { Category, CalendarEvent, ParseError, parseYYYYMMDD } from '../types';

/**
 * Result of parsing event body content
 */
interface EventsResult {
  categories: Category[];
  errors: ParseError[];
}

// Regex for category header: @CategoryName or @CategoryName [#hexcolor]
const CATEGORY_REGEX = /^@(.+?)(?:\s+\[(#[0-9a-fA-F]{3,6})\])?$/;

// Regex for event line: - YYYYMMDD: description or - YYYYMMDD-YYYYMMDD: description
const EVENT_REGEX = /^-\s+(\d{8})(?:-(\d{8}))?:\s*(.+)$/;

/**
 * Parse the body content (after frontmatter) into categories and events
 */
export function parseEvents(
  content: string,
  startLine: number
): EventsResult {
  const lines = content.split('\n');
  const errors: ParseError[] = [];
  const categories: Category[] = [];

  let currentCategory: Category | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = startLine + i + 1; // 1-indexed line number
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      continue;
    }

    // Check for category header
    const categoryMatch = trimmed.match(CATEGORY_REGEX);
    if (categoryMatch) {
      const name = categoryMatch[1].trim();
      const color = categoryMatch[2]; // may be undefined

      currentCategory = {
        name,
        color,
        events: [],
      };
      categories.push(currentCategory);
      continue;
    }

    // Check for event line
    const eventMatch = trimmed.match(EVENT_REGEX);
    if (eventMatch) {
      if (!currentCategory) {
        errors.push({
          line: lineNum,
          message: 'Event found before any category header',
        });
        continue;
      }

      const startDateStr = eventMatch[1];
      const endDateStr = eventMatch[2]; // may be undefined for single-day
      const description = eventMatch[3].trim();

      const startDate = parseYYYYMMDD(startDateStr);
      if (!startDate) {
        errors.push({
          line: lineNum,
          message: `Invalid start date: "${startDateStr}"`,
        });
        continue;
      }

      let endDate: Date;
      if (endDateStr) {
        const parsed = parseYYYYMMDD(endDateStr);
        if (!parsed) {
          errors.push({
            line: lineNum,
            message: `Invalid end date: "${endDateStr}"`,
          });
          continue;
        }
        endDate = parsed;

        // Validate end >= start
        if (endDate < startDate) {
          errors.push({
            line: lineNum,
            message: `End date (${endDateStr}) is before start date (${startDateStr})`,
          });
          continue;
        }
      } else {
        endDate = startDate;
      }

      const event: CalendarEvent = {
        startDate,
        endDate,
        description,
      };
      currentCategory.events.push(event);
      continue;
    }

    // Line doesn't match any pattern - could be a comment or invalid
    // Skip lines starting with // (comments)
    if (!trimmed.startsWith('//')) {
      errors.push({
        line: lineNum,
        message: `Unrecognized line: "${trimmed}"`,
      });
    }
  }

  return { categories, errors };
}
