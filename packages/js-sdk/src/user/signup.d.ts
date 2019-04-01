import { User } from './user';
export declare function signup(data: object | User, options?: {
    timeout?: number;
    state?: boolean;
}): Promise<User>;
