import { join } from 'path';
import Proxyquire from 'proxyquire';

// TODO: is there a better way to adjust relative path
export function mockRequiresIn(fromPath, relativePath, mocks, properyName) {
  const path = join(fromPath, relativePath);
  const res = Proxyquire(path, mocks);
  return properyName ? res[properyName] : res;
}
