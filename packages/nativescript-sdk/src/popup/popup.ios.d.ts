/// <reference types="node" />
import { EventEmitter } from 'events';
export interface PopupOptions {
    toolbarColor?: string;
    showTitle?: boolean;
}
export declare class Popup extends EventEmitter {
    private _open;
    private _viewController;
    isClosed(): boolean;
    onLoaded(listener: any): this;
    onClosed(listener: any): this;
    onError(listener: any): this;
    open(url?: string, options?: PopupOptions): Promise<this>;
    close(): Promise<this>;
    static open(url: string, options?: PopupOptions): Promise<Popup>;
}
