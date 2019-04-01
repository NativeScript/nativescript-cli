/// <reference types="node" />
import { EventEmitter } from 'events';
export declare class Popup extends EventEmitter {
    isClosed(): boolean;
    onLoaded(listener: (event: any) => void): this;
    onClosed(listener: () => void): this;
    onError(listener: () => void): this;
    close(): Promise<void>;
    static open(url: string, options?: any): Promise<Popup>;
}
