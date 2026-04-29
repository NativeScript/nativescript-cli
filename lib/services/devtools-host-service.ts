import * as http from "http";
import * as path from "path";
import * as fs from "fs";
import { AddressInfo } from "net";
import { INet } from "../common/declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IProjectData } from "../definitions/project";
import {
	IDevtoolsHostService,
	IDevtoolsHostOrigin,
} from "../definitions/devtools-host-service";
import { injector } from "../common/yok";

const LOOPBACK_HOST = "127.0.0.1";
const DEVTOOLS_ORIGIN = "https://chrome-devtools-frontend.appspot.com";
const PORT_RANGE_START = 41500;
const PORT_RANGE_END = 41999;

const CONTENT_TYPES: { [ext: string]: string } = {
	".map": "application/json; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
};

interface IServerEntry {
	server: http.Server;
	port: number;
	rootDir: string;
}

export class DevtoolsHostService implements IDevtoolsHostService {
	private servers = new Map<string, IServerEntry>();

	constructor(
		private $net: INet,
		private $logger: ILogger,
		private $platformsDataService: IPlatformsDataService,
	) {}

	public async start(
		projectData: IProjectData,
		platform: string,
	): Promise<IDevtoolsHostOrigin | null> {
		const key = platform.toLowerCase();
		const existing = this.servers.get(key);
		if (existing) {
			return { platform: key, origin: this.formatOrigin(existing.port) };
		}

		const platformData = this.$platformsDataService.getPlatformData(
			platform,
			projectData,
		);
		const rootDir = platformData?.appDestinationDirectoryPath;
		if (!rootDir) {
			this.$logger.warn(
				`DevTools host: unable to resolve output directory for ${platform}.`,
			);
			return null;
		}

		let port: number;
		try {
			port = await this.$net.getAvailablePortInRange(
				PORT_RANGE_START,
				PORT_RANGE_END,
			);
		} catch (err) {
			this.$logger.warn(
				`DevTools host: no free port in ${PORT_RANGE_START}-${PORT_RANGE_END}. Source maps will not load in Chrome DevTools. (${err?.message || err})`,
			);
			return null;
		}

		const server = http.createServer((req, res) =>
			this.handleRequest(req, res, rootDir),
		);

		try {
			await new Promise<void>((resolve, reject) => {
				const onError = (err: Error) => reject(err);
				server.once("error", onError);
				server.listen(port, LOOPBACK_HOST, () => {
					server.off("error", onError);
					resolve();
				});
			});
		} catch (err) {
			this.$logger.warn(
				`DevTools host: failed to bind ${LOOPBACK_HOST}:${port} (${(err as Error)?.message || err}).`,
			);
			return null;
		}

		// `.unref()` so a lingering server doesn't keep the CLI process alive.
		server.unref();

		const actualPort = (server.address() as AddressInfo)?.port ?? port;
		const entry: IServerEntry = { server, port: actualPort, rootDir };
		this.servers.set(key, entry);

		const origin = this.formatOrigin(actualPort);
		this.$logger.info(
			`DevTools host (${platform}) serving ${rootDir} at ${origin}`,
		);
		return { platform: key, origin };
	}

	public async stop(platform: string): Promise<void> {
		const key = platform.toLowerCase();
		const entry = this.servers.get(key);
		if (!entry) {
			return;
		}

		this.servers.delete(key);
		await new Promise<void>((resolve) => {
			entry.server.close(() => resolve());
		});
	}

	public async stopAll(): Promise<void> {
		const platforms = Array.from(this.servers.keys());
		await Promise.all(platforms.map((p) => this.stop(p)));
	}

	public getOrigin(platform: string): string | null {
		const entry = this.servers.get(platform.toLowerCase());
		return entry ? this.formatOrigin(entry.port) : null;
	}

	private formatOrigin(port: number): string {
		return `http://${LOOPBACK_HOST}:${port}`;
	}

	private handleRequest(
		req: http.IncomingMessage,
		res: http.ServerResponse,
		rootDir: string,
	): void {
		res.setHeader("Access-Control-Allow-Origin", DEVTOOLS_ORIGIN);
		res.setHeader("Vary", "Origin");
		res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "*");
		res.setHeader("Cache-Control", "no-cache");

		if (req.method === "OPTIONS") {
			res.writeHead(204);
			res.end();
			return;
		}

		if (req.method !== "GET" && req.method !== "HEAD") {
			res.writeHead(405);
			res.end();
			return;
		}

		let urlPath: string;
		try {
			urlPath = decodeURIComponent(
				new URL(req.url || "/", "http://x").pathname,
			);
		} catch {
			res.writeHead(400);
			res.end();
			return;
		}

		const ext = path.extname(urlPath).toLowerCase();
		if (!CONTENT_TYPES[ext]) {
			res.writeHead(403);
			res.end();
			return;
		}

		const resolvedRoot = path.resolve(rootDir);
		const filePath = path.resolve(resolvedRoot, "." + urlPath);
		if (
			filePath !== resolvedRoot &&
			!filePath.startsWith(resolvedRoot + path.sep)
		) {
			res.writeHead(403);
			res.end();
			return;
		}

		fs.stat(filePath, (statErr, stats) => {
			if (statErr || !stats.isFile()) {
				res.writeHead(404);
				res.end();
				return;
			}

			res.setHeader("Content-Type", CONTENT_TYPES[ext]);
			res.setHeader("Content-Length", String(stats.size));

			if (req.method === "HEAD") {
				res.writeHead(200);
				res.end();
				return;
			}

			const stream = fs.createReadStream(filePath);
			stream.on("error", () => {
				if (!res.headersSent) {
					res.writeHead(500);
				}
				res.end();
			});
			res.writeHead(200);
			stream.pipe(res);
		});
	}
}

injector.register("devtoolsHostService", DevtoolsHostService);
