import { File } from 'tns-core-modules/file-system';
import { isAndroid } from 'tns-core-modules/platform';
import { FileStore as BaseFileStore } from 'kinvey-js-sdk/dist/datastore';
import { KinveyError } from 'kinvey-js-sdk/dist/export';
import { KinveyResponse } from 'kinvey-js-sdk/dist/export';
import {
    session,
    Session,
    Request as BackgroundRequest,
    ResultEventData,
    ErrorEventData
} from 'nativescript-background-http';

export interface FileUploadMetadata {
    mimeType: string,
    size: number,
    public: boolean,
    _filename: string
}

export interface FileUploadOptions {
    headers: { [key: string]: string }
}

export class NativeScriptFileStore extends BaseFileStore {
    private static readonly sessionName = 'kinvey-file-upload';
    private session: Session = null;

    constructor() {
        super();
        this.session = session(NativeScriptFileStore.sessionName);
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

        options.headers['content-type'] = metadata.mimeType;
        options.headers['content-range'] = `bytes 0-${metadata.size - 1}/${metadata.size}`;

        const request: BackgroundRequest = {
            method: 'PUT',
            url: url,
            headers: options.headers,
            description: `Uploading ${metadata._filename || 'file'}`
        };

        const task = this.session.uploadFile(filePath, request);

        return new Promise((resolve, reject) => {
            const responseData: { statusCode: number, data?: any, headers?: any } = {} as any;
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
