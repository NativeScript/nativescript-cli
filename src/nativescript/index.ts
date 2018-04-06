import * as pick from 'lodash/pick';
import { StorageProvider as StorageProviderEnum, repositoryProvider } from '../core/datastore';
import './offline-data-storage';

export * from './kinvey';

const supportedStorageProviders = repositoryProvider.getSupportedStorages();
export const StorageProvider = pick(StorageProviderEnum, supportedStorageProviders);

import { FileStore } from './filestore';
const Files = new FileStore();
export { Files };
