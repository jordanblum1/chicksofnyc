/**
 * Logger utility that conditionally logs based on environment
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isServerSide = typeof window === 'undefined';

// Colors for different log levels (for development)
const logColors = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
  reset: '\x1b[0m',  // Reset
};

/**
 * Formats a log message with a tag
 */
const formatMessage = (tag: string, message: string): string => {
  // Check if the message already contains the tag in square brackets
  if (message.includes(`[${tag}]`)) {
    return message;
  }
  
  // If the message already has a different tag, don't add another tag
  const tagRegex = /\[([A-Z0-9_]+)\]/;
  if (tagRegex.test(message)) {
    return message;
  }
  
  return `[${tag}] ${message}`;
};

/**
 * Core logging function that respects environment
 */
const log = (
  level: LogLevel,
  tag: string,
  message: string,
  ...args: any[]
): void => {
  // Skip debug and info logs in production
  if (isProduction && (level === 'debug' || level === 'info')) {
    return;
  }

  const formattedMessage = formatMessage(tag, message);
  
  // Use colors in development mode and on server-side
  if (!isProduction && isServerSide) {
    const color = logColors[level];
    console[level](`${color}${formattedMessage}${logColors.reset}`, ...args);
  } else {
    console[level](formattedMessage, ...args);
  }
};

// Public API
const logger = {
  debug: (tag: string, message: string, ...args: any[]): void => 
    log('debug', tag, message, ...args),
  
  info: (tag: string, message: string, ...args: any[]): void => 
    log('info', tag, message, ...args),
  
  warn: (tag: string, message: string, ...args: any[]): void => 
    log('warn', tag, message, ...args),
  
  error: (tag: string, message: string, ...args: any[]): void => 
    log('error', tag, message, ...args),
};

export default logger; 
