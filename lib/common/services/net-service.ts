import * as net from "net";
import { sleep } from "../helpers";

export class Net implements INet {
	private static DEFAULT_INTERVAL = 1000;

	constructor(private $errors: IErrors,
		private $childProcess: IChildProcess,
		private $logger: ILogger,
		private $osInfo: IOsInfo) { }

	public async getFreePort(): Promise<number> {
		const server = net.createServer((sock: string) => { /* empty - noone will connect here */ });

		return new Promise<number>((resolve, reject) => {
			let isResolved = false;
			server.listen(0, () => {
				const portUsed = server.address().port;
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
		return new Promise<boolean>((resolve, reject) => {
			let isResolved = false;
			const server = net.createServer();

			server.on("error", (err: Error) => {
				if (!isResolved) {
					isResolved = true;
					resolve(false);
				}
			});

			server.once("close", () => {
				if (!isResolved) { // "close" will be emitted right after "error"
					isResolved = true;
					resolve(true);
				}
			});

			server.on("listening", (err: Error) => {
				if (err && !isResolved) {
					isResolved = true;
					resolve(true);
				}

				server.close();
			});

			server.listen(port, "localhost");
		});
	}

	public async getAvailablePortInRange(startPort: number, endPort?: number): Promise<number> {
		endPort = endPort || 65534;
		while (!(await this.isPortAvailable(startPort))) {
			startPort++;
			if (startPort > endPort) {
				this.$errors.failWithoutHelp("Unable to find free local port.");
			}
		}

		return startPort;
	}

	public async waitForPortToListen(waitForPortListenData: IWaitForPortListenData): Promise<boolean> {
		if (!waitForPortListenData) {
			this.$errors.failWithoutHelp("You must pass port and timeout for check.");
		}

		const { timeout, port } = waitForPortListenData;
		const interval = waitForPortListenData.interval || Net.DEFAULT_INTERVAL;

		const endTime = new Date().getTime() + timeout;
		const platformData: IDictionary<{ command: string, regex: RegExp }> = {
			"darwin": {
				command: "netstat -f inet -p tcp -anL",
				regex: new RegExp(`\\.${port}\\b`, "g")
			},
			"linux": {
				command: "netstat -tnl",
				regex: new RegExp(`:${port}\\s`, "g")
			},
			"win32": {
				command: "netstat -ant -p tcp",
				regex: new RegExp(`TCP\\s+(\\d+\\.){3}\\d+:${port}.*?LISTEN`, "g")
			}
		};

		const platform = this.$osInfo.platform();
		const currentPlatformData = platformData[platform];
		if (!currentPlatformData) {
			this.$errors.failWithoutHelp(`Unable to check for free ports on ${platform}. Supported platforms are: ${_.keys(platformData).join(", ")}`);
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

$injector.register("net", Net);
