import { Subject } from './Subject';
import { Subscriber } from './Subscriber';
import { Subscription } from './Subscription';
/**
 * @class AsyncSubject<T>
 */
export declare class AsyncSubject<T> extends Subject<T> {
    value: T;
    hasNext: boolean;
    hasCompleted: boolean;
    protected _subscribe(subscriber: Subscriber<any>): Subscription;
    next(value: T): void;
    complete(): void;
}
