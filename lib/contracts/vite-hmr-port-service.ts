import { Contract } from "../common/di/contract";

/**
 * Chooses the local port the Vite HMR dev server binds for a platform.
 */
@Contract({ name: "viteHmrPortService" })
export abstract class ViteHmrPortService {
	/**
	 * Resolves the port the Vite dev server for `platform` listens on: the
	 * first free port at or above `NS_HMR_PORT` (default 5173) that no other
	 * platform in this process holds. Resolved once per platform and stable
	 * for the life of the process, so the build watcher (which bakes the port
	 * into `bundle.mjs`), the dev server and the Android `adb reverse` tunnel
	 * all agree on it.
	 *
	 * With `NS_HMR_STRICT_PORT` set, a busy preferred port fails instead of
	 * moving to the next one.
	 */
	abstract getPort(platform: string): Promise<number>;
}
