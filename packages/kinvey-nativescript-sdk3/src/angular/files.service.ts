/* eslint-disable class-methods-use-this */

import { Inject, Injectable } from '@angular/core';
import create from '../core/files/create';
import download from '../core/files/download';
import downloadByUrl from '../core/files/downloadByUrl';
import find from '../core/files/find';
import findById from '../core/files/findById';
import remove from '../core/files/remove';
import removeById from '../core/files/removeById';
import stream from '../core/files/stream';
import update from '../core/files/update';
import upload from '../core/files/upload';
import init from '../core/kinvey/init';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  create(file, metadata, options?) {
    return create(file, metadata, options);
  }

  download(id, options?) {
    return download(id, options);
  }

  downloadByUrl(url, options?) {
    return downloadByUrl(url, options);
  }

  find(query?, options?) {
    return find(query, options);
  }

  findById(id, options?) {
    return findById(id, options);
  }

  remove() {
    return remove();
  }

  removeById(id, options?) {
    return removeById(id, options);
  }

  stream(id, options?) {
    return stream(id, options);
  }

  update(file, metadata, options?) {
    return update(file, metadata, options);
  }

  upload(file, metadata, options?) {
    return upload(file, metadata, options);
  }
}
