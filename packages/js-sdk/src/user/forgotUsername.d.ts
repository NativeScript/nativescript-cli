export interface ForgotUsernameOptions {
    timeout?: number;
}
export declare function forgotUsername(email: string, options?: ForgotUsernameOptions): Promise<any>;
