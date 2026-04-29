import { IProjectData } from "./project";

/**
 * Origin of a running loopback HTTP server for a single platform,
 * e.g. "http://127.0.0.1:41500".
 */
export interface IDevtoolsHostOrigin {
	platform: string;
	origin: string;
}

/**
 * Loopback HTTP server (per platform) that serves the webpack output
 * directory with CORS so Chrome DevTools (served from
 * https://chrome-devtools-frontend.appspot.com) can fetch .map / .js
 * files while a debug session is active.
 *
 * Bound to 127.0.0.1 only; never exposed to the network.
 */
export interface IDevtoolsHostService {
	/**
	 * Start (or return existing) HTTP server for a platform. Idempotent
	 * per platform — subsequent calls return the same origin.
	 */
	start(
		projectData: IProjectData,
		platform: string,
	): Promise<IDevtoolsHostOrigin | null>;

	/**
	 * Stop the server for a single platform. Quiet no-op if nothing running.
	 */
	stop(platform: string): Promise<void>;

	/**
	 * Stop all running servers.
	 */
	stopAll(): Promise<void>;

	/**
	 * Current origin for a platform, or null if not running.
	 */
	getOrigin(platform: string): string | null;
}
