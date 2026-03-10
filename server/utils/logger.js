const redactContext = (context = {}) => {
  if (!context || typeof context !== 'object') {
    return {};
  }

  return Object.entries(context).reduce((result, [key, value]) => {
    if (value === undefined) return result;
    result[key] = value;
    return result;
  }, {});
};

const writeLog = (level, event, context = {}) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redactContext(context),
  };

  const output = JSON.stringify(entry);

  if (level === 'error') {
    console.error(output);
    return;
  }

  if (level === 'warn') {
    console.warn(output);
    return;
  }

  console.log(output);
};

export const logger = {
  info(event, context) {
    writeLog('info', event, context);
  },
  warn(event, context) {
    writeLog('warn', event, context);
  },
  error(event, context) {
    writeLog('error', event, context);
  },
};
