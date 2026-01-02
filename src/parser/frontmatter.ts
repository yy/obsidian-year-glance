import {
  YearGlanceConfig,
  DEFAULT_CONFIG,
  LayoutType,
  WeekStart,
  DisplayStyle,
  ParseError,
} from '../types';

/**
 * Result of frontmatter extraction
 */
interface FrontmatterResult {
  config: YearGlanceConfig;
  bodyStartLine: number; // line number where body content starts (after frontmatter)
  errors: ParseError[];
}

/**
 * Extract and parse YAML frontmatter from content
 */
export function parseFrontmatter(content: string): FrontmatterResult {
  const lines = content.split('\n');
  const errors: ParseError[] = [];
  let config = { ...DEFAULT_CONFIG };
  let bodyStartLine = 0;

  // Find frontmatter delimiters
  const firstLine = lines[0]?.trim();
  if (firstLine !== '---') {
    // No frontmatter, use defaults
    return { config, bodyStartLine: 0, errors };
  }

  // Find closing delimiter
  let closingIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      closingIndex = i;
      break;
    }
  }

  if (closingIndex === -1) {
    errors.push({ line: 1, message: 'Unclosed frontmatter: missing closing ---' });
    return { config, bodyStartLine: 0, errors };
  }

  bodyStartLine = closingIndex + 1;

  // Parse YAML lines (simple key: value format)
  for (let i = 1; i < closingIndex; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse key: value
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) {
      errors.push({ line: i + 1, message: `Invalid YAML: missing colon in "${trimmed}"` });
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim().toLowerCase();
    const value = trimmed.slice(colonIndex + 1).trim();

    switch (key) {
      case 'year': {
        const year = parseInt(value, 10);
        if (isNaN(year) || year < 1 || year > 9999) {
          errors.push({ line: i + 1, message: `Invalid year: "${value}"` });
        } else {
          config.year = year;
        }
        break;
      }

      case 'layout': {
        const validLayouts: LayoutType[] = ['3x4', '52-rows', '12-rows', 'continuous'];
        if (validLayouts.includes(value as LayoutType)) {
          config.layout = value as LayoutType;
        } else {
          errors.push({
            line: i + 1,
            message: `Invalid layout: "${value}". Valid options: ${validLayouts.join(', ')}`,
          });
        }
        break;
      }

      case 'weekstart': {
        const validStarts: WeekStart[] = ['sunday', 'monday'];
        const normalized = value.toLowerCase();
        if (validStarts.includes(normalized as WeekStart)) {
          config.weekStart = normalized as WeekStart;
        } else {
          errors.push({
            line: i + 1,
            message: `Invalid weekStart: "${value}". Valid options: sunday, monday`,
          });
        }
        break;
      }

      case 'style': {
        const validStyles: DisplayStyle[] = ['compact', 'expanded'];
        const normalized = value.toLowerCase();
        if (validStyles.includes(normalized as DisplayStyle)) {
          config.style = normalized as DisplayStyle;
        } else {
          errors.push({
            line: i + 1,
            message: `Invalid style: "${value}". Valid options: compact, expanded`,
          });
        }
        break;
      }

      case 'showtoday': {
        const normalized = value.toLowerCase();
        if (normalized === 'true' || normalized === 'yes') {
          config.showToday = true;
        } else if (normalized === 'false' || normalized === 'no') {
          config.showToday = false;
        } else {
          errors.push({
            line: i + 1,
            message: `Invalid showToday: "${value}". Valid options: true, false`,
          });
        }
        break;
      }

      default:
        // Unknown key - ignore silently for forward compatibility
        break;
    }
  }

  return { config, bodyStartLine, errors };
}
