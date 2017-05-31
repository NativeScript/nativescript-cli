import { EventEmitter } from 'events';
import { Client } from 'kinvey-js-sdk/dist/client';

export declare class Push extends EventEmitter {
    constructor(client?: Client);
}
