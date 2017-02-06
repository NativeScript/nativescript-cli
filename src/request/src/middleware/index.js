import CacheMiddleware from './src/cache';
import HttpMiddleware from './src/http';
import Middleware from './src/middleware';
import ParseMiddleware from './src/parse';
import SerializeMiddleware from './src/serialize';
import Storage, { MemoryAdapter } from './src/storage';

export {
  CacheMiddleware,
  HttpMiddleware,
  MemoryAdapter,
  ParseMiddleware,
  SerializeMiddleware,
  Storage
};

export default Middleware;
