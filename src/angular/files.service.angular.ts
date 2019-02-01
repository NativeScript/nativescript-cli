/* eslint-disable class-methods-use-this */

import { Injectable } from '@angular/core';
import create from '../files/create';
import download from '../files/download';
import downloadByUrl from '../files/downloadByUrl';
import find from '../files/find';
import findById from '../files/findById';
import remove from '../files/remove';
import removeById from '../files/removeById';
import stream from '../files/stream';
import update from '../files/update';
import upload from '../files/upload';

@Injectable({
  providedIn: 'root'
})
export default class FileService {
  create(...args) {
    return create(...args);
  }

  download(...args) {
    return download(...args);
  }

  downloadByUrl(...args) {
    return downloadByUrl(...args);
  }

  find(...args) {
    return find(...args);
  }

  findById(...args) {
    return findById(...args);
  }

  remove(...args) {
    return remove(...args);
  }

  removeById(...args) {
    return removeById(...args);
  }

  stream(...args) {
    return stream(...args);
  }

  update(...args) {
    return update(...args);
  }

  upload(...args) {
    return upload(...args);
  }
}
