import * as pick from 'lodash/pick';
import { StorageProvider as StorageProviderEnum, repositoryProvider } from '../core/datastore';
import './offline-data-storage';

export * from './kinvey';
export { Push } from './push';

const supportedStorageProviders = repositoryProvider.getSupportedStorages();
export const StorageProvider = pick(StorageProviderEnum, supportedStorageProviders);
