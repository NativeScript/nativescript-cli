import { Promise } from 'es6-promise';

import { DataProcessor } from './data-processor';
import { repositoryProvider } from '../repositories';

export class NetworkDataProcessor extends DataProcessor {
  _getRepository() {
    if (!this._repoPromise) {
      const repo = repositoryProvider.getNetworkRepository();
      this._repoPromise = Promise.resolve(repo);
    }
    return this._repoPromise;
  }

  // TODO: implement autopagination? or maybe in repo - if it's going to be used internally
}
