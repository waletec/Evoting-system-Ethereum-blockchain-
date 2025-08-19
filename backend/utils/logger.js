/* Simple logger that redacts sensitive fields before logging */

const SENSITIVE_KEYS = new Set([
  'code',
  'password',
  'token',
  'authorization',
  'Authorization',
  'adminToken'
]);

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function redactValue(value) {
  if (typeof value === 'string') {
    // Redact common sensitive patterns in strings
    let redacted = value
      .replace(/("?code"?\s*:\s*")[^"]*(")/gi, '$1***REDACTED***$2')
      .replace(/(Bearer\s+)[A-Za-z0-9\-_.]+/g, '$1***REDACTED***')
      .replace(/("?token"?\s*:\s*")[^"]*(")/gi, '$1***REDACTED***$2')
      .replace(/("?password"?\s*:\s*")[^"]*(")/gi, '$1***REDACTED***$2');
    return redacted;
  }

  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (isPlainObject(value)) {
    const clone = {};
    for (const [k, v] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(k)) {
        clone[k] = '***REDACTED***';
      } else {
        clone[k] = redactValue(v);
      }
    }
    return clone;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactValue(value.message),
      stack: value.stack
    };
  }

  return value;
}

function sanitizeArgs(args) {
  return args.map(arg => redactValue(arg));
}

const logger = {
  info: (...args) => console.log(...sanitizeArgs(args)),
  warn: (...args) => console.warn(...sanitizeArgs(args)),
  error: (...args) => console.error(...sanitizeArgs(args)),
  debug: (...args) => console.debug(...sanitizeArgs(args))
};

module.exports = logger;


