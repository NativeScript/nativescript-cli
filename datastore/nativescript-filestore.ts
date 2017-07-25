import { File } from 'tns-core-modules/file-system';
import { isAndroid } from 'tns-core-modules/platform';
import {
    session,
    Session,
    Request as BackgroundRequest,
    ResultEventData,
    ErrorEventData,
    Task
} from 'nativescript-background-http';

import { FileStore as BaseFileStore } from 'kinvey-js-sdk/dist/datastore';
import { KinveyError } from 'kinvey-js-sdk/dist/export';
import { KinveyResponse } from 'kinvey-js-sdk/dist/export';

export interface FileUploadMetadata {
    mimeType: string,
    size: number,
    public: boolean,
    _filename: string
}

export interface FileUploadOptions {
    headers: { [key: string]: string }
}

interface KinveyResponseData {
    statusCode: number,
    data?: any,
    headers?: any
}

export class NativeScriptFileStore extends BaseFileStore {
    private static readonly sessionName = 'kinvey-file-upload';
    private _session: Session = null;

    constructor() {
        super();
    }

    get session() {
        if (!this._session) {
            this._session = session(NativeScriptFileStore.sessionName);
        }
        return this._session;
    }

    protected makeUploadRequest(url: string, file: File, metadata: FileUploadMetadata, options: FileUploadOptions)
    protected makeUploadRequest(url: string, filePath: string, metadata: FileUploadMetadata, options: FileUploadOptions)
    protected makeUploadRequest(url: string, filePath: string | File, metadata: FileUploadMetadata, options: FileUploadOptions) {
        if (filePath instanceof File) {
            filePath = filePath.path;
        }

        if (!File.exists(filePath)) {
            return Promise.reject(new KinveyError('File does not exist'));
        }

        const request = this.buildBackgroundRequestObj(url, metadata, options);
        const task = this.session.uploadFile(filePath, request);

        return this.backgroundTaskToPromise(task);
    }

    private backgroundTaskToPromise(task: Task) {
        return new Promise((resolve, reject) => {
            const responseData: KinveyResponseData = {} as any;
            let wasError = false;

            task.on('error', (eventData: ErrorEventData) => {
                responseData.data = eventData.error;
                responseData.statusCode = 500;
                wasError = true;
            });
            task.on('responded', (eventData: ResultEventData) => {
                const body = this.tryParseResponseBody(eventData.data);
                responseData.data = body;
            });
            task.on('complete', (eventData: any) => {
                if (isAndroid) {
                    this.javaResponseToJsObject(eventData.response, responseData);
                }
                const resp = new KinveyResponse(responseData);
                if (wasError) {
                    reject(resp);
                } else {
                    resolve(resp);
                }
            });
        });
    }

    private buildBackgroundRequestObj(url: string, metadata: FileUploadMetadata, options: FileUploadOptions) {
        options.headers['content-type'] = metadata.mimeType;
        options.headers['content-range'] = `bytes 0-${metadata.size - 1}/${metadata.size}`;

        return {
            method: 'PUT',
            url: url,
            headers: options.headers,
            description: `Uploading ${metadata._filename || 'file'}`
        } as BackgroundRequest;
    }

    private tryParseResponseBody(body: string) {
        let result: any = null;
        try {
            result = JSON.parse(body);
        } catch (ex) {
            result = body;
        }
        return result;
    }

    private javaResponseToJsObject(javaResponse, jsObject) {
        jsObject.statusCode = javaResponse.getHttpCode();
        jsObject.headers = {};
        const headerMap = javaResponse.getHeaders();
        const headerNames = headerMap.keySet().toArray();
        for (const header of headerNames) {
            jsObject.headers[header] = headerMap.get(header);
        }
    }
}
