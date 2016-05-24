import { Observable } from '../Observable';
import { Subscriber } from '../Subscriber';
export declare type NodeStyleEventEmmitter = {
    addListener: (eventName: string, handler: Function) => void;
    removeListener: (eventName: string, handler: Function) => void;
};
export declare type JQueryStyleEventEmitter = {
    on: (eventName: string, handler: Function) => void;
    off: (eventName: string, handler: Function) => void;
};
export declare type EventTargetLike = EventTarget | NodeStyleEventEmmitter | JQueryStyleEventEmitter | NodeList | HTMLCollection;
/**
 * We need this JSDoc comment for affecting ESDoc.
 * @extends {Ignored}
 * @hide true
 */
export declare class FromEventObservable<T, R> extends Observable<T> {
    private sourceObj;
    private eventName;
    private selector;
    /**
     * Creates an Observable that emits events of a specific type coming from the
     * given event target.
     *
     * <span class="informal">Creates an Observable from DOM events, or Node
     * EventEmitter events or others.</span>
     *
     * <img src="./img/fromEvent.png" width="100%">
     *
     * Creates an Observable by attaching an event listener to an "event target",
     * which may be an object with `addEventListener` and `removeEventListener`,
     * a Node.js EventEmitter, a jQuery style EventEmitter, a NodeList from the
     * DOM, or an HTMLCollection from the DOM. The event handler is attached when
     * the output Observable is subscribed, and removed when the Subscription is
     * unsubscribed.
     *
     * @example <caption>Emits clicks happening on the DOM document</caption>
     * var clicks = Rx.Observable.fromEvent(document, 'click');
     * clicks.subscribe(x => console.log(x));
     *
     * @see {@link from}
     * @see {@link fromEventPattern}
     *
     * @param {EventTargetLike} target The DOMElement, event target, Node.js
     * EventEmitter, NodeList or HTMLCollection to attach the event handler to.
     * @param {string} eventName The event name of interest, being emitted by the
     * `target`.
     * @param {function(...args: any): T} [selector] An optional function to
     * post-process results. It takes the arguments from the event handler and
     * should return a single value.
     * @return {Observable<T>}
     * @static true
     * @name fromEvent
     * @owner Observable
     */
    static create<T>(target: EventTargetLike, eventName: string, selector?: (...args: Array<any>) => T): Observable<T>;
    constructor(sourceObj: EventTargetLike, eventName: string, selector?: (...args: Array<any>) => T);
    private static setupSubscription<T>(sourceObj, eventName, handler, subscriber);
    protected _subscribe(subscriber: Subscriber<T>): void;
}
