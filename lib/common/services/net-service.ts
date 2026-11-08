import * as net from "net";
import * as _ from "lodash";
import { sleep } from "../helpers";
import {
	IErrors,
	INet,
	IChildProcess,
	IOsInfo,
	IWaitForPortListenData,
	IDictionary,
} from "../declarations";
import { injector } from "../yok";

export class Net implements INet {
	private static DEFAULT_INTERVAL = 1000;

	constructor(
		private $errors: IErrors,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $osInfo: IOsInfo,
	) {}

	public async getFreePort(): Promise<number> {
		const server = net.createServer((sock: net.Socket) => {
			/* empty - noone will connect here */
		});

		return new Promise<number>((resolve, reject) => {
			let isResolved = false;
			server.listen(0, () => {
				const portUsed = (<net.AddressInfo>server.address()).port;
				server.close();

				if (!isResolved) {
					isResolved = true;
					resolve(portUsed);
				}
			});

			server.on("error", (err: Error) => {
				if (!isResolved) {
					isResolved = true;
					reject(err);
				}
			});
		});
	}

	public async isPortAvailable(port: number): Promise<boolean> {
		// A listener on one address does not stop a bind on another (e.g. the
		// wildcard next to the loopback), so each of them has to be free.
		for (const host of ["127.0.0.1", "::1", "0.0.0.0", "::"]) {
			if (!(await this.canListen(port, host))) {
				return false;
			}
		}

		return true;
	}

	private canListen(port: number, host: string): Promise<boolean> {
		return new Promise<boolean>((resolve) => {
			const server = net.createServer();

			server.once("error", (err: NodeJS.ErrnoException) => {
				// The host has no such address (e.g. IPv6 is disabled), so nothing
				// can be listening on it either.
				resolve(err.code === "EADDRNOTAVAIL" || err.code === "EAFNOSUPPORT");
			});

			server.once("listening", () => {
				server.close(() => resolve(true));
			});

			server.listen(port, host);
		});
	}

	public async getAvailablePortInRange(
		startPort: number,
		endPort?: number,
	): Promise<number> {
		endPort = endPort || 65534;
		while (!(await this.isPortAvailable(startPort))) {
			startPort++;
			if (startPort > endPort) {
				this.$errors.fail("Unable to find free local port.");
			}
		}

		return startPort;
	}

	public async waitForPortToListen(
		waitForPortListenData: IWaitForPortListenData,
	): Promise<boolean> {
		if (!waitForPortListenData) {
			this.$errors.fail("You must pass port and timeout for check.");
		}

		const { timeout, port } = waitForPortListenData;
		const interval = waitForPortListenData.interval || Net.DEFAULT_INTERVAL;

		const endTime = new Date().getTime() + timeout;
		const platformData: IDictionary<{ command: string; regex: RegExp }> = {
			darwin: {
				command: "netstat -f inet -p tcp -anL",
				regex: new RegExp(`\\.${port}\\b`, "g"),
			},
			linux: {
				command: "netstat -tnl",
				regex: new RegExp(`:${port}\\s`, "g"),
			},
			win32: {
				command: "netstat -ant -p tcp",
				regex: new RegExp(`TCP\\s+(\\d+\\.){3}\\d+:${port}.*?LISTEN`, "g"),
			},
		};

		const platform = this.$osInfo.platform();
		const currentPlatformData = platformData[platform];
		if (!currentPlatformData) {
			this.$errors.fail(
				`Unable to check for free ports on ${platform}. Supported platforms are: ${_.keys(
					platformData,
				).join(", ")}`,
			);
		}

		while (true) {
			const { command, regex } = currentPlatformData;

			try {
				const result = await this.$childProcess.exec(command);
				if (result && !!result.match(regex)) {
					return true;
				}
			} catch (err) {
				this.$logger.trace(`Error while calling '${command}': ${err}`);
			}

			const currentTime = new Date().getTime();
			if (currentTime >= endTime) {
				break;
			}

			await sleep(interval);
		}

		return false;
	}
}

injector.register("net", Net);
