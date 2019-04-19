import { Injectable, Inject } from '@angular/core';
import { init, Files, Query } from '../nativescript';
import { KinveyConfigToken } from './utils';

@Injectable({
  providedIn: 'root'
})
export class FilesService {
  constructor(@Inject(KinveyConfigToken) config: any) {
    init(config);
  }

  create(file: any, metadata: any, options?: any) {
    return Files.create(file, metadata, options);
  }

  download(id?: string, options?: any) {
    return Files.download(id, options);
  }

  downloadByUrl(url: string, options?: any) {
    return Files.downloadByUrl(url, options);
  }

  find(query?: Query, options?: any) {
    return Files.find(query, options);
  }

  findById(id: string, options?: any) {
    return Files.findById(id, options);
  }

  remove() {
    return Files.remove();
  }

  removeById(id: string, options?: any) {
    return Files.removeById(id, options);
  }

  stream(id: string, options?: any) {
    return Files.stream(id, options);
  }

  update(file: any, metadata: any, options?: any) {
    return Files.update(file, metadata, options);
  }

  upload(file: any, metadata: any, options?: any) {
    return Files.upload(file, metadata, options);
  }
}
