import pick from 'lodash/pick';
import { StorageProvider as StorageProviderEnum, repositoryProvider } from '../core/datastore';
import './offline-data-storage';

export * from './kinvey';
export { Files } from './files';

const supportedStorageProviders = repositoryProvider.getSupportedStorages();
export const StorageProvider = pick(StorageProviderEnum, supportedStorageProviders);
