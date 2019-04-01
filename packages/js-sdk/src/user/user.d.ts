import { Acl } from '../acl';
import { Kmd } from '../kmd';
import { Entity } from '../storage';
export interface UserData extends Entity {
    _socialIdentity?: object;
    username?: string;
    email?: string;
}
export declare class User {
    data: UserData;
    constructor(data?: UserData);
    readonly _id: string;
    readonly _acl: Acl;
    readonly _kmd: Kmd;
    readonly metadata: Kmd;
    readonly authtoken: string;
    readonly _socialIdentity: object;
    readonly username: string;
    readonly email: string;
    isActive(): boolean;
    isEmailVerified(): boolean;
    me(options?: {
        timeout?: number;
    }): Promise<this>;
    update(data: object, options?: {
        timeout?: number;
    }): Promise<this>;
    registerForLiveService(): Promise<boolean>;
    unregisterFromLiveService(): Promise<boolean>;
    logout(options?: {
        timeout?: number;
    }): Promise<this>;
}
