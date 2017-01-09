declare module "lockfile" {
	export function lock(lockFilename: string, lockParams: ILockParams, callback: (err: Error) => void): void;
	export function lockSync(lockFilename: string, lockParams: ILockSyncParams): void;
	export function unlock(lockFilename: string, callback: (err: Error) => void): void;
	export function unlockSync(lockFilename: string): void;
	export function check(lockFilename: string, lockParams: ILockParams, callback: (err: Error, isLocked: boolean) => void): boolean;
	export function checkSync(path: string, opts: Options): boolean;

	export interface Options {
		wait?: number;
		stale?: number;
		retries?: number;
		retryWait?: number;
	}

	interface ILockSyncParams {
		retries: number;
		stale: number;
	}

	interface ILockParams extends ILockSyncParams {
		retryWait: number;
	}
}
