const { CacheMiddleware } = require('./cache');
const { HttpMiddleware } = require('./http');
const { Middleware } = require('./middleware');
const { ParseMiddleware } = require('./parse');
const { SerializeMiddleware } = require('./serialize');
const { Storage, MemoryAdapter } = require('./storage');

module.exports = {
  CacheMiddleware: CacheMiddleware,
  HttpMiddleware: HttpMiddleware,
  Middleware: Middleware,
  ParseMiddleware: ParseMiddleware,
  SerializeMiddleware: SerializeMiddleware,
  Storage: Storage,
  MemoryAdapter: MemoryAdapter
};
