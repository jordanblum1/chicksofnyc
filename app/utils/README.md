# Utils - Logger

This directory contains utility functions for the ChicksOfNYC project.

## Logger

The `logger.ts` utility provides environment-aware logging that automatically suppresses development-focused logs in production while displaying all logs in development.

### Usage

```typescript
import logger from '../utils/logger';

// Debug logs (only shown in development)
logger.debug('TAG', 'Your debug message', optionalData);

// Info logs (only shown in development)
logger.info('TAG', 'Your info message', optionalData);

// Warning logs (shown in all environments)
logger.warn('TAG', 'Your warning message', optionalData);

// Error logs (shown in all environments)
logger.error('TAG', 'Your error message', optionalError);
```

### Benefits

1. **Environment-aware**: Debug and info logs are automatically suppressed in production
2. **Consistent formatting**: All logs use a consistent format with tags
3. **Colored output**: Development logs are colored in the server console
4. **Type-safe**: TypeScript definitions for all methods

### Example

Converting existing console logs:

```typescript
// Before
console.log(`[GEOCODE] ✓ Cache hit for "${address}"`);
console.error('[GEOCODE] ✗ Cache error:', error);

// After
logger.info('GEOCODE', `✓ Cache hit for "${address}"`);
logger.error('GEOCODE', '✗ Cache error:', error);
```

### How it works

- The logger detects the environment using `process.env.NODE_ENV`
- Debug and info logs are suppressed in production
- Warning and error logs are shown in all environments
- Tags are used for better categorization and filtering 
