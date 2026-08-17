import * as net from "net";
import { IDictionary, IErrors } from "../../common/declarations";
import { isTruthyEnvFlag } from "../../common/helpers";
import { injector } from "../../common/yok";
import { ViteHmrPortService as ViteHmrPortServiceContract } from "../../contracts/vite-hmr-port-service";

const DEFAULT_PORT = 5173;
const MAX_PORT = 65535;

export class ViteHmrPortServiceImpl implements ViteHmrPortServiceContract {
	private ports: IDictionary<Promise<number>> = {};
	private allocated = new Set<number>();
	// Allocation runs one platform at a time: `ns run` resolves every
	// device's platform concurrently, and two probes racing on the same
	// free port would both claim it.
	private queue: Promise<unknown> = Promise.resolve();

	constructor(
		private $errors: IErrors,
		private $logger: ILogger,
	) {}

	public getPort(platform: string): Promise<number> {
		const key = platform.toLowerCase();
		if (!this.ports[key]) {
			this.ports[key] = this.queue.then(() => this.allocate(key));
			this.queue = this.ports[key].catch((): void => undefined);
		}
		return this.ports[key];
	}

	private async allocate(platform: string): Promise<number> {
		const preferred = this.getPreferredPort();
		const strict = isTruthyEnvFlag(process.env.NS_HMR_STRICT_PORT);

		for (let port = preferred; port <= MAX_PORT; port++) {
			const busy = this.allocated.has(port) || !(await this.isPortFree(port));
			if (!busy) {
				this.allocated.add(port);
				if (port !== preferred) {
					this.$logger.info(
						`Vite dev server port ${preferred} is in use; using port ${port} for ${platform} instead.`,
					);
				}
				return port;
			}
			if (strict) {
				this.$errors.fail(
					`Vite dev server port ${preferred} is in use and NS_HMR_STRICT_PORT is set. Free the port, or pick another one with NS_HMR_PORT.`,
				);
			}
		}

		return this.$errors.fail(
			`Unable to find a free port for the Vite dev server (tried ${preferred}-${MAX_PORT}). Set NS_HMR_PORT to a free port.`,
		);
	}

	private getPreferredPort(): number {
		const fromEnv = Number(process.env.NS_HMR_PORT);
		return Number.isFinite(fromEnv) && fromEnv > 0
			? Math.floor(fromEnv)
			: DEFAULT_PORT;
	}

	/**
	 * A port is free when the wildcard bind the dev server performs would
	 * succeed AND nothing answers on loopback. Both checks are needed: on
	 * macOS a listener bound only to `127.0.0.1` does not block a `0.0.0.0`
	 * bind, yet loopback is exactly what the device reaches through
	 * `adb reverse` and the iOS Simulator, so such a port must count as busy.
	 */
	private async isPortFree(port: number): Promise<boolean> {
		if (!(await this.canBindWildcard(port))) {
			return false;
		}
		return !(await this.isLoopbackListening(port));
	}

	private canBindWildcard(port: number): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const server = net.createServer();
			server.unref();
			// Only EADDRINUSE means "taken"; anything else (EACCES on a
			// privileged port, an unsupported address family) is left for
			// the dev server itself to report.
			server.once("error", (err: NodeJS.ErrnoException) =>
				resolve(err.code !== "EADDRINUSE"),
			);
			server.listen(port, "0.0.0.0", () => server.close(() => resolve(true)));
		});
	}

	private isLoopbackListening(port: number): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const socket = net.connect({ port, host: "127.0.0.1" });
			const done = (open: boolean) => {
				socket.destroy();
				resolve(open);
			};
			socket.once("connect", () => done(true));
			socket.once("error", () => done(false));
			socket.setTimeout(1000, () => done(false));
		});
	}
}

injector.register("viteHmrPortService", ViteHmrPortServiceImpl);
