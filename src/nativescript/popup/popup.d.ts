import { EventEmitter } from 'events';

export declare class Popup extends EventEmitter {
  open(url: string): Popup;
  close(): Popup;
}
