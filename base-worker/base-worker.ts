import { path } from 'tns-core-modules/file-system';
import { KinveyError } from 'kinvey-js-sdk/dist/export';

export interface WorkerScriptOptions {
  timeout: number;
  closeAfterResponse: boolean;
}

/** 
 * Executes a script in a NativeScript Worker (a separate thread)
 */
export class BaseWorker {
  private _worker: Worker;
  private _resolveUploadPromise: (uploadResponse: any) => void;
  private _rejectUploadPromise: (err: KinveyError) => void;
  private _uploadScript: string
  private _workerTimeout: number;
  private _closeAfterResponse: boolean;

  constructor(asboluteScriptPath: string, options?: WorkerScriptOptions)
  constructor(callerDir: string, scriptPathRelativeToCallerDir: string | WorkerScriptOptions, options?: WorkerScriptOptions)
  constructor(callerDir: string, scriptPathRelativeToCallerDir: string | WorkerScriptOptions, options: WorkerScriptOptions = { timeout: 30 * 60 * 1000, closeAfterResponse: true }) {
    let opts = options;
    if (typeof scriptPathRelativeToCallerDir === 'string') {
      this._uploadScript = path.join(callerDir, scriptPathRelativeToCallerDir);
    } else {
      this._uploadScript = callerDir;
      opts = scriptPathRelativeToCallerDir || options; // options is not mandatory in first ctor signature
    }
    this._workerTimeout = opts.timeout;
    this._closeAfterResponse = opts.closeAfterResponse;
  }

  postMessage(message: any) {
    this._initializeWorker();
    return new Promise((resolve, reject) => {
      this._resolveUploadPromise = resolve;
      this._rejectUploadPromise = reject;

      this._worker.postMessage(message);
    });
  }

  terminate() {
    this._worker.terminate();
  }

  private _initializeWorker() {
    this._worker = new Worker(this._uploadScript);
    this._worker.onmessage = this._onMessage.bind(this);
    this._worker.onerror = this._onError.bind(this);

    setTimeout(() => {
      this.terminate();
      if (this._rejectUploadPromise) {
        this._rejectUploadPromise(new KinveyError('Worker forcefully terminated due to timeout'));
      }
    }, this._workerTimeout);
  }

  private _onMessage(message: MessageEvent) {
    if (this._closeAfterResponse) {
      this.terminate();
    }
    this._resolveUploadPromise(message.data);
  }

  private _onError(err: ErrorEvent) {
    this._rejectUploadPromise(new KinveyError(err.message));
  }
}
