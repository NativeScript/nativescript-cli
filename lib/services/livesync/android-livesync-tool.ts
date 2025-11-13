import * as path from "path";
import * as _ from "lodash";
import * as crypto from "crypto";
import { IDictionary, IErrors, IFileSystem } from "../../common/declarations";
import { IInjector } from "../../common/definitions/yok";
import { injector } from "../../common/yok";
import { color } from "../../color";

const PROTOCOL_VERSION_LENGTH_SIZE = 1;
const PROTOCOL_OPERATION_LENGTH_SIZE = 1;
const SIZE_BYTE_LENGTH = 1;
const REPORT_LENGTH = 1;
const DO_REFRESH_LENGTH = 1;
const SYNC_OPERATION_TIMEOUT = 60000;
const TRY_CONNECT_TIMEOUT = 60000;
const DEFAULT_LOCAL_HOST_ADDRESS = "127.0.0.1";

export class AndroidLivesyncTool implements IAndroidLivesyncTool {
	public static DELETE_FILE_OPERATION = 7;
	public static CREATE_FILE_OPERATION = 8;
	public static DO_SYNC_OPERATION = 9;
	public static ERROR_REPORT = 1;
	public static OPERATION_END_REPORT = 2;
	public static OPERATION_END_NO_REFRESH_REPORT_CODE = 3;
	public static DO_REFRESH = 1;
	public static SKIP_REFRESH = 0;
	public static APP_IDENTIFIER_MISSING_ERROR =
		'You need to provide "appIdentifier" as a configuration property!';
	public static APP_PLATFORMS_PATH_MISSING_ERROR =
		'You need to provide "appPlatformsPath" as a configuration property!';
	public static SOCKET_CONNECTION_ALREADY_EXISTS_ERROR =
		"Socket connection already exists.";
	public static SOCKET_CONNECTION_TIMED_OUT_ERROR =
		"Socket connection timed out.";
	public static NO_SOCKET_CONNECTION_AVAILABLE_ERROR =
		"No socket connection available.";
	public protocolVersion: string;
	private operationPromises: IDictionary<any>;
	private socketError: string | Error;
	private socketConnection: ILiveSyncSocket;
	private configuration: IAndroidLivesyncToolConfiguration;
	private pendingConnectionData: {
		connectionTimer?: NodeJS.Timeout;
		socketTimer?: NodeJS.Timeout;
		rejectHandler?: Function;
		socket?: INetSocket;
	} = null;

	constructor(
		private $androidProcessService: Mobile.IAndroidProcessService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $injector: IInjector,
	) {
		this.operationPromises = Object.create(null);
		this.socketError = null;
		this.socketConnection = null;
	}

	public async connect(
		configuration: IAndroidLivesyncToolConfiguration,
	): Promise<void> {
		if (!configuration.appIdentifier) {
			this.$errors.fail(AndroidLivesyncTool.APP_IDENTIFIER_MISSING_ERROR);
		}

		if (!configuration.appPlatformsPath) {
			this.$errors.fail(AndroidLivesyncTool.APP_PLATFORMS_PATH_MISSING_ERROR);
		}

		if (this.socketConnection) {
			this.$errors.fail(
				AndroidLivesyncTool.SOCKET_CONNECTION_ALREADY_EXISTS_ERROR,
			);
		}

		if (!configuration.localHostAddress) {
			configuration.localHostAddress =
				process.env.NATIVESCRIPT_LIVESYNC_ADDRESS || DEFAULT_LOCAL_HOST_ADDRESS;
		}

		const connectTimeout = configuration.connectTimeout || TRY_CONNECT_TIMEOUT;

		this.configuration = configuration;
		this.socketError = null;

		const port = await this.$androidProcessService.forwardFreeTcpToAbstractPort(
			{
				deviceIdentifier: configuration.deviceIdentifier,
				appIdentifier: configuration.appIdentifier,
				abstractPort: `localabstract:${configuration.appIdentifier}-livesync`,
			},
		);

		const connectionResult = await this.connectEventuallyUntilTimeout(
			this.createSocket.bind(this, port),
			connectTimeout,
			configuration,
		);
		this.handleConnection(connectionResult);
	}

	public async sendFile(filePath: string): Promise<void> {
		await this.sendFileHeader(filePath);
		await this.sendFileContent(filePath);
	}

	public async sendFiles(filePaths: string[]) {
		for (const filePath of filePaths) {
			if (this.$fs.getLsStats(filePath).isFile()) {
				if (!this.$fs.exists(filePath)) {
					this.$errors.fail(`${filePath} doesn't exist.`);
				}

				await this.sendFile(filePath);
			}
		}
	}

	public sendDirectory(directoryPath: string) {
		const list = this.$fs.enumerateFilesInDirectorySync(directoryPath);
		return this.sendFiles(list);
	}

	public async removeFile(filePath: string): Promise<void> {
		this.verifyActiveConnection();
		const filePathData = this.getFilePathData(filePath);
		const headerBuffer = Buffer.alloc(
			PROTOCOL_OPERATION_LENGTH_SIZE +
				SIZE_BYTE_LENGTH +
				filePathData.filePathLengthSize +
				filePathData.filePathLengthBytes,
		);

		let offset = 0;
		offset += headerBuffer.write(
			AndroidLivesyncTool.DELETE_FILE_OPERATION.toString(),
			offset,
			PROTOCOL_OPERATION_LENGTH_SIZE,
		);
		offset = headerBuffer.writeInt8(filePathData.filePathLengthSize, offset);
		offset += headerBuffer.write(
			filePathData.filePathLengthString,
			offset,
			filePathData.filePathLengthSize,
		);
		headerBuffer.write(
			filePathData.relativeFilePath,
			offset,
			filePathData.filePathLengthBytes,
		);
		const hash = crypto.createHash("md5").update(headerBuffer).digest();

		await this.writeToSocket(headerBuffer);
		await this.writeToSocket(hash);
	}
	public async removeFiles(files: string[]): Promise<void> {
		for (const file of files) {
			await this.removeFile(file);
		}
	}

	public generateOperationIdentifier(): string {
		return crypto.randomBytes(16).toString("hex");
	}

	public isOperationInProgress(operationId: string): boolean {
		return !!this.operationPromises[operationId];
	}

	public sendDoSyncOperation(
		options?: IDoSyncOperationOptions,
	): Promise<IAndroidLivesyncSyncOperationResult> {
		options = _.assign(
			{ doRefresh: true, timeout: SYNC_OPERATION_TIMEOUT },
			options,
		);
		const { doRefresh, timeout, operationId } = options;
		const id = operationId || this.generateOperationIdentifier();
		const operationPromise: Promise<IAndroidLivesyncSyncOperationResult> =
			new Promise((resolve, reject) => {
				if (!this.verifyActiveConnection(reject)) {
					return;
				}
				const message = `${AndroidLivesyncTool.DO_SYNC_OPERATION}${id}`;
				const headerBuffer = Buffer.alloc(
					Buffer.byteLength(message) + DO_REFRESH_LENGTH,
				);
				const socketId = this.socketConnection.uid;
				const doRefreshCode = doRefresh
					? AndroidLivesyncTool.DO_REFRESH
					: AndroidLivesyncTool.SKIP_REFRESH;
				const offset = headerBuffer.write(message);

				headerBuffer.writeUInt8(doRefreshCode, offset);
				const hash = crypto.createHash("md5").update(headerBuffer).digest();
				this.writeToSocket(headerBuffer)
					.then(() => {
						this.writeToSocket(hash).catch(reject);
					})
					.catch(reject);

				const timeoutId = setTimeout(() => {
					if (this.isOperationInProgress(id)) {
						this.handleSocketError(
							socketId,
							"Sync operation is taking too long",
						);
					}
				}, timeout);

				this.operationPromises[id] = {
					resolve,
					reject,
					socketId,
					timeoutId,
				};
			});

		return operationPromise;
	}

	public end(error?: Error) {
		if (this.socketConnection) {
			const socketUid = this.socketConnection.uid;
			const socket = this.socketConnection;
			error =
				error ||
				this.getErrorWithMessage(
					"Socket connection ended before sync operation is complete.",
				);
			//remove listeners and delete this.socketConnection
			this.cleanState(socketUid);
			//call end of the connection (close and error callbacks won't be called - listeners removed)
			socket.end();
			socket.destroy();
			//reject all pending sync requests and clear timeouts
			this.rejectPendingSyncOperations(socketUid, error);
		}
	}

	public hasConnection(): boolean {
		return !!this.socketConnection;
	}

	private async sendFileHeader(filePath: string): Promise<void> {
		this.verifyActiveConnection();
		const filePathData = this.getFilePathData(filePath);
		const stats = this.$fs.getFsStats(filePathData.filePath);
		const fileContentLengthBytes = stats.size;
		const fileContentLengthString = fileContentLengthBytes.toString();
		const fileContentLengthSize = Buffer.byteLength(fileContentLengthString);
		const headerBuffer = Buffer.alloc(
			PROTOCOL_OPERATION_LENGTH_SIZE +
				SIZE_BYTE_LENGTH +
				filePathData.filePathLengthSize +
				filePathData.filePathLengthBytes +
				SIZE_BYTE_LENGTH +
				fileContentLengthSize,
		);

		if (filePathData.filePathLengthSize > 255) {
			this.$errors.fail("File name size is longer that 255 digits.");
		} else if (fileContentLengthSize > 255) {
			this.$errors.fail("File name size is longer that 255 digits.");
		}

		let offset = 0;
		offset += headerBuffer.write(
			AndroidLivesyncTool.CREATE_FILE_OPERATION.toString(),
			offset,
			PROTOCOL_OPERATION_LENGTH_SIZE,
		);
		offset = headerBuffer.writeUInt8(filePathData.filePathLengthSize, offset);
		offset += headerBuffer.write(
			filePathData.filePathLengthString,
			offset,
			filePathData.filePathLengthSize,
		);
		offset += headerBuffer.write(
			filePathData.relativeFilePath,
			offset,
			filePathData.filePathLengthBytes,
		);
		offset = headerBuffer.writeUInt8(fileContentLengthSize, offset);
		headerBuffer.write(fileContentLengthString, offset, fileContentLengthSize);
		const hash = crypto.createHash("md5").update(headerBuffer).digest();

		await this.writeToSocket(headerBuffer);
		await this.writeToSocket(hash);
	}

	private sendFileContent(filePath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			if (!this.verifyActiveConnection(reject)) {
				return;
			}

			const fileStream = this.$fs.createReadStream(filePath);
			const fileHash = crypto.createHash("md5");

			fileStream
				.on("data", (chunk: Buffer) => {
					fileHash.update(chunk);
					this.writeToSocket(chunk).catch(reject);
				})
				.on("end", () => {
					this.writeToSocket(fileHash.digest())
						.then(() => resolve())
						.catch(reject);
				})
				.on("error", (error: Error) => {
					reject(error);
				});
		});
	}

	private createSocket(port: number): ILiveSyncSocket {
		const socket = this.$injector.resolve("LiveSyncSocket");
		socket.connect(port, this.configuration.localHostAddress);
		return socket;
	}

	private checkConnectionStatus() {
		if (this.socketConnection === null) {
			const defaultError = this.getErrorWithMessage(
				AndroidLivesyncTool.NO_SOCKET_CONNECTION_AVAILABLE_ERROR,
			);
			const error = this.socketError || defaultError;

			return error;
		}
	}

	private verifyActiveConnection(rejectHandler?: any) {
		const error = this.checkConnectionStatus();
		if (error && rejectHandler) {
			rejectHandler(error);
			return false;
		}

		if (error && !rejectHandler) {
			this.$errors.fail(error.toString());
		}

		return true;
	}

	private handleConnection({
		socket,
		data,
	}: {
		socket: ILiveSyncSocket;
		data: Buffer | string;
	}) {
		this.socketConnection = socket;
		this.socketConnection.uid = this.generateOperationIdentifier();

		const versionLength = (<Buffer>data).readUInt8(0);
		const versionBuffer = data.slice(
			PROTOCOL_VERSION_LENGTH_SIZE,
			versionLength + PROTOCOL_VERSION_LENGTH_SIZE,
		);
		const appIdentifierBuffer = data.slice(
			versionLength + PROTOCOL_VERSION_LENGTH_SIZE,
			data.length,
		);

		const protocolVersion = versionBuffer.toString();
		const appIdentifier = appIdentifierBuffer.toString();
		this.$logger.trace(
			`Handle socket connection for app identifier: ${appIdentifier} with protocol version: ${protocolVersion}.`,
		);
		this.protocolVersion = protocolVersion;

		this.socketConnection.on("data", (connectionData: Buffer) =>
			this.handleData(socket.uid, connectionData),
		);
		this.socketConnection.on("close", (hasError: boolean) =>
			this.handleSocketClose(socket.uid, hasError),
		);
		this.socketConnection.on("error", (err: Error) => {
			const error = new Error(`Socket Error:\n${err}`);
			if (this.configuration.errorHandler) {
				this.configuration.errorHandler(error);
			} else {
				this.handleSocketError(socket.uid, error.message);
			}
		});
	}

	private connectEventuallyUntilTimeout(
		factory: () => ILiveSyncSocket,
		timeout: number,
		configuration: IAndroidLivesyncToolConfiguration,
	): Promise<{ socket: ILiveSyncSocket; data: Buffer | string }> {
		return new Promise((resolve, reject) => {
			let lastKnownError: Error | string,
				isConnected = false;

			const connectionTimer = setTimeout(async () => {
				if (!isConnected) {
					isConnected = true;
					if (
						this.pendingConnectionData &&
						typeof this.pendingConnectionData.socketTimer === "number"
					) {
						clearTimeout(this.pendingConnectionData.socketTimer);
					}

					const applicationPid =
						await this.$androidProcessService.getAppProcessId(
							configuration.deviceIdentifier,
							configuration.appIdentifier,
						);
					if (!applicationPid) {
						this.$logger.trace(
							"In Android LiveSync tool, lastKnownError is: ",
							lastKnownError,
						);
						this.$logger.info(
							color.yellow(
								`Application ${configuration.appIdentifier} is not running on device ${configuration.deviceIdentifier}.`,
							),
						);
						this.$logger.info(
							color.cyan(
								`This issue may be caused by:
	* crash at startup (try \`ns debug android --debug-brk\` to check why it crashes)
	* different application identifier in your package.json and in your gradle files (check your identifier in \`package.json\` and in all *.gradle files in your App_Resources directory)
	* device is locked
	* manual closing of the application`,
							),
						);
						reject(
							new Error(
								`Application ${configuration.appIdentifier} is not running`,
							),
						);
					} else {
						reject(
							lastKnownError ||
								new Error(
									AndroidLivesyncTool.SOCKET_CONNECTION_TIMED_OUT_ERROR,
								),
						);
					}

					this.pendingConnectionData = null;
				}
			}, timeout);

			this.pendingConnectionData = {
				connectionTimer,
				rejectHandler: reject,
			};

			const tryConnect = () => {
				const socket = factory();

				const tryConnectAfterTimeout = (error: Error) => {
					if (isConnected) {
						this.pendingConnectionData = null;
						return;
					}

					if (typeof error === "boolean" && error) {
						error = new Error("Socket closed due to error");
					}

					lastKnownError = error;
					socket.removeAllListeners();
					this.pendingConnectionData.socketTimer = setTimeout(tryConnect, 1000);
				};

				if (this.pendingConnectionData) {
					this.pendingConnectionData.socket = socket;
				}

				socket.once("data", (data) => {
					socket.removeListener("close", tryConnectAfterTimeout);
					socket.removeListener("error", tryConnectAfterTimeout);
					isConnected = true;
					clearTimeout(connectionTimer);
					resolve({ socket, data });
				});
				socket.on("close", tryConnectAfterTimeout);
				socket.on("error", tryConnectAfterTimeout);
			};

			tryConnect();
		});
	}

	private handleData(socketId: string, data: any) {
		const reportType = data.readUInt8();
		const infoBuffer = data.slice(REPORT_LENGTH, data.length);

		if (reportType === AndroidLivesyncTool.ERROR_REPORT) {
			const errorMessage = infoBuffer.toString();
			this.handleSocketError(socketId, errorMessage);
		} else if (reportType === AndroidLivesyncTool.OPERATION_END_REPORT) {
			this.handleSyncEnd({ data: infoBuffer, didRefresh: true });
		} else if (
			reportType === AndroidLivesyncTool.OPERATION_END_NO_REFRESH_REPORT_CODE
		) {
			this.handleSyncEnd({ data: infoBuffer, didRefresh: false });
		}
	}

	private handleSyncEnd({
		data,
		didRefresh,
	}: {
		data: any;
		didRefresh: boolean;
	}) {
		const operationId = data.toString();
		const promiseHandler = this.operationPromises[operationId];

		if (promiseHandler) {
			clearTimeout(promiseHandler.timeoutId);
			promiseHandler.resolve({ operationId, didRefresh });
			delete this.operationPromises[operationId];
		}
	}

	private handleSocketClose(socketId: string, hasError: boolean) {
		const errorMessage = "Socket closed from server before operation end.";
		this.handleSocketError(socketId, errorMessage);
	}

	private handleSocketError(socketId: string, errorMessage: string) {
		const error = this.getErrorWithMessage(errorMessage);
		if (this.socketConnection && this.socketConnection.uid === socketId) {
			this.socketError = error;
			this.end(error);
		} else {
			this.rejectPendingSyncOperations(socketId, error);
		}
	}

	private cleanState(socketId: string) {
		if (this.socketConnection && this.socketConnection.uid === socketId) {
			this.socketConnection.removeAllListeners();
			this.socketConnection = null;
		}
	}

	private rejectPendingSyncOperations(socketId: string, error: Error) {
		_.keys(this.operationPromises).forEach((operationId) => {
			const operationPromise = this.operationPromises[operationId];
			if (operationPromise.socketId === socketId) {
				clearTimeout(operationPromise.timeoutId);
				operationPromise.reject(error);
				delete this.operationPromises[operationId];
			}
		});
	}

	private getErrorWithMessage(errorMessage: string) {
		const error = new Error(errorMessage);
		error.message = errorMessage;

		return error;
	}

	private getFilePathData(filePath: string): {
		relativeFilePath: string;
		filePathLengthBytes: number;
		filePathLengthString: string;
		filePathLengthSize: number;
		filePath: string;
	} {
		const relativeFilePath = this.resolveRelativePath(filePath);
		const filePathLengthBytes = Buffer.byteLength(relativeFilePath);
		const filePathLengthString = filePathLengthBytes.toString();
		const filePathLengthSize = Buffer.byteLength(filePathLengthString);

		return {
			relativeFilePath,
			filePathLengthBytes,
			filePathLengthString,
			filePathLengthSize,
			filePath,
		};
	}

	private resolveRelativePath(filePath: string): string {
		const relativeFilePath = path.relative(
			this.configuration.appPlatformsPath,
			filePath,
		);

		return this.$mobileHelper.buildDevicePath(relativeFilePath);
	}

	private async writeToSocket(data: Buffer): Promise<Boolean> {
		this.verifyActiveConnection();
		const result = await this.socketConnection.writeAsync(data);
		return result;
	}
}
injector.register("androidLivesyncTool", AndroidLivesyncTool);
