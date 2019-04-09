import * as log from 'loglevel';
import * as prefix from 'loglevel-plugin-prefix';

// Set the default log level to ERROR. This will not overwrite the log level
// if it has already been set.
log.setDefaultLevel(log.levels.ERROR);

// Register log with the prefix plugin
prefix.reg(log);

// Create a custom log prefix format
const logPrefix = {
  template: '[%t] %l (%n):',
  timestampFormatter(date: Date) {
    return date.toISOString();
  }
};
prefix.apply(log, logPrefix);

// Overrride the getLogger function to apply the custom log prefix format
// const { getLogger } = log;
// log.getLogger = function getLoggerOverride(name: string) {
//   const logger = getLogger(name);
//   prefix.apply(logger, logPrefix);
//   return logger;
// };

// Export
export { log as logger };
