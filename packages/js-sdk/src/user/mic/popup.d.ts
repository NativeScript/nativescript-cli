/// <reference types="node" />
import { EventEmitter } from 'events';
export interface PopupEvent {
    url?: string;
}
export interface PopupWindow extends EventEmitter {
    isClosed(): boolean;
    onLoaded(listener: (event: PopupEvent) => void): this;
    onClosed(listener: () => void): this;
    onError(listener: () => void): this;
    close(): Promise<void>;
}
export interface Popup {
    open(url: string): Promise<PopupWindow>;
}
export declare function open(url: string): Promise<PopupWindow>;
