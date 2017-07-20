import { FileStore as BaseFileStore } from 'kinvey-js-sdk/dist/datastore';
import { KinveyResponse } from 'kinvey-js-sdk/dist/export';
import { File } from 'tns-core-modules/file-system';
import { isAndroid } from 'tns-core-modules/platform';
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
    protected makeUploadRequest(url: string, file: string, metadata: FileUploadMetadata, options: FileUploadOptions)
    protected makeUploadRequest(url: string, file: string|File, metadata: FileUploadMetadata, options: FileUploadOptions) {
        if (file instanceof File) {
            file = file.path;
        }

        options.headers['content-type'] = metadata.mimeType;
        options.headers['content-range'] = `bytes 0-${metadata.size - 1}/${metadata.size}`;

        const request: BackgroundRequest = {
            method: 'PUT',
            url: url,
            headers: options.headers,
            description: `Uploading ${metadata._filename || 'file'}`
        };

        const task = this.session.uploadFile(file, request);

        return new Promise((resolve, reject) => {
            const responseData: { statusCode: number, data?: any, headers?: any } = {} as any;
            let wasError = false;
            
            task.on('error', (eventData: ErrorEventData) => {
                responseData.data = eventData.error;
                responseData.statusCode = 500;
                wasError = true;
            });
            task.on('responded', (eventData: ResultEventData) => {
                let responseBody: any = null;
                try {
                    responseBody = JSON.parse(eventData.data);
                } catch (ex) {
                    responseBody = eventData.data;
                }
                responseData.data = responseBody;
            });
            task.on('complete', (eventData: any) => {
                if (isAndroid) {
                    responseData.statusCode = eventData.response.getHttpCode();
                    responseData.headers = {};
                    const headerMap = eventData.response.getHeaders();
                    const headerNames = headerMap.keySet().toArray();
                    for (const header of headerNames) {
                        responseData.headers[header] = headerMap.get(header);
                    }
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
}
