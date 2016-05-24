import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
import { Subscription } from '../Subscription';
import { ConnectableObservable } from '../observable/ConnectableObservable';
export declare class MulticastObservable<T> extends Observable<T> {
    protected source: Observable<T>;
    private connectable;
    private selector;
    constructor(source: Observable<T>, connectable: ConnectableObservable<T>, selector: (source: Observable<T>) => Observable<T>);
    protected _subscribe(subscriber: Subscriber<T>): Subscription;
}
