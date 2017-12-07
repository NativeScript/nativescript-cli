import { MemoryKeyValuePersister } from './memory-key-value-persister';

function getPersister() {
  return new MemoryKeyValuePersister();
}

export const persisterProvider = {
  getPersister
};
