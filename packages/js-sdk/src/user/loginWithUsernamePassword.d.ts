import { GetTokenWithUsernamePasswordOptions } from './mic';
export interface MICOptions extends GetTokenWithUsernamePasswordOptions {
    micId?: string;
}
export declare function loginWithUsernamePassword(username: string, password: string, options?: MICOptions): Promise<import("./user").User>;
