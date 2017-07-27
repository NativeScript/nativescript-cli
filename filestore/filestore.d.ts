import { Kinvey } from '../kinvey';

export class NativeScriptFileStore<T extends Kinvey.File> {
  useDeltaFetch: boolean;
  find(query?: Kinvey.Query, options?: Kinvey.RequestOptions): Promise<T[]>;
  findById(id: string, options?: Kinvey.RequestOptions): Promise<T>;
  download(name: string, options?: Kinvey.RequestOptions): Promise<T>;
  downloadByUrl(url: string, options?: Kinvey.RequestOptions): Promise<{}>;
  stream(name: string, options?: Kinvey.RequestOptions): Promise<T>;
  group(aggregation: Kinvey.Aggregation, options?: Kinvey.RequestOptions): Promise<{}>;
  count(query?: Kinvey.Query, options?: RequestOptions): Promise<{ count: number }>;
  upload(file: {}, metadata?: Kinvey.FileMetadata, options?: Kinvey.RequestOptions): Promise<T>;
  remove(query?: Kinvey.Query, options?: Kinvey.RequestOptions): Promise<{ count: number }>;
  removeById(id: string, options?: Kinvey.RequestOptions): Promise<{ count: number }>;
}
