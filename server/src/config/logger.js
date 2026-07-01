const serializeErr = (err) => {
  if (!err) return undefined;
  return {
    message: err.message,
    stack: err.stack,
    name: err.name,
    code: err.code
  };
};

export const logger = {
  info: (ctx, msg) => {
    let logMsg = msg;
    let logCtx = ctx;
    if (typeof ctx === 'string') {
      logMsg = ctx;
      logCtx = {};
    }
    const { err, ...rest } = logCtx || {};
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      ...rest,
      ...(err && { err: serializeErr(err) }),
      message: logMsg
    }));
  },
  warn: (ctx, msg) => {
    let logMsg = msg;
    let logCtx = ctx;
    if (typeof ctx === 'string') {
      logMsg = ctx;
      logCtx = {};
    }
    const { err, ...rest } = logCtx || {};
    console.warn(JSON.stringify({
      level: 'warn',
      timestamp: new Date().toISOString(),
      ...rest,
      ...(err && { err: serializeErr(err) }),
      message: logMsg
    }));
  },
  error: (ctx, msg) => {
    let logMsg = msg;
    let logCtx = ctx;
    if (typeof ctx === 'string') {
      logMsg = ctx;
      logCtx = {};
    }
    const { err, ...rest } = logCtx || {};
    console.error(JSON.stringify({
      level: 'error',
      timestamp: new Date().toISOString(),
      ...rest,
      ...(err && { err: serializeErr(err) }),
      message: logMsg
    }));
  },
  fatal: (ctx, msg) => {
    let logMsg = msg;
    let logCtx = ctx;
    if (typeof ctx === 'string') {
      logMsg = ctx;
      logCtx = {};
    }
    const { err, ...rest } = logCtx || {};
    console.error(JSON.stringify({
      level: 'fatal',
      timestamp: new Date().toISOString(),
      ...rest,
      ...(err && { err: serializeErr(err) }),
      message: logMsg
    }));
  },
  child: (childCtx) => {
    return {
      info: (ctx, msg) => logger.info({ ...childCtx, ...(typeof ctx === 'object' ? ctx : {}) }, typeof ctx === 'string' ? ctx : msg),
      warn: (ctx, msg) => logger.warn({ ...childCtx, ...(typeof ctx === 'object' ? ctx : {}) }, typeof ctx === 'string' ? ctx : msg),
      error: (ctx, msg) => logger.error({ ...childCtx, ...(typeof ctx === 'object' ? ctx : {}) }, typeof ctx === 'string' ? ctx : msg),
      fatal: (ctx, msg) => logger.fatal({ ...childCtx, ...(typeof ctx === 'object' ? ctx : {}) }, typeof ctx === 'string' ? ctx : msg),
      child: (moreCtx) => logger.child({ ...childCtx, ...moreCtx })
    };
  }
};

export default logger;
