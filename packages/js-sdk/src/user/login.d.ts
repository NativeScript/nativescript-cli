import { User } from './user';
export interface LoginOptions {
    timeout?: number;
}
export declare function login(username: string | {
    username?: string;
    password?: string;
    _socialIdentity?: any;
}, password?: string, options?: LoginOptions): Promise<User>;
