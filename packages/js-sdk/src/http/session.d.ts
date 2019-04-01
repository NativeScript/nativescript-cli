import { Entity } from '../storage';
export interface SessionObject extends Entity {
    _socialIdentity?: any;
}
export interface SessionStore {
    get(key: string): string | null;
    set(key: string, session: string): boolean;
    remove(key: string): boolean;
}
export declare function getSession(): SessionObject | null;
export declare function setSession(session: SessionObject): boolean;
export declare function removeSession(): boolean;
