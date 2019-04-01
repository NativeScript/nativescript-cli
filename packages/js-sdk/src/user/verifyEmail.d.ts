export interface VerifyEmailOptions {
    timeout?: number;
}
export declare function verifyEmail(username: string, options?: VerifyEmailOptions): Promise<any>;
