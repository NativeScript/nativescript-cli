import * as net from "net";
import * as path from "path";
import * as crypto from "crypto";

const PROTOCOL_VERSION_LENGTH_SIZE = 1;
const PROTOCOL_OPERATION_LENGTH_SIZE = 1;
const SIZE_BYTE_LENGTH = 1;
const DELETE_FILE_OPERATION = 7;
const CREATE_FILE_OPERATION = 8;
const DO_SYNC_OPERATION = 9;
const ERROR_REPORT = 1;
const OPERATION_END_REPORT = 2;
const OPERATION_END_NO_REFRESH_REPORT_CODE = 3;
const REPORT_LENGTH = 1;
const SYNC_OPERATION_TIMEOUT = 60000;
const TRY_CONNECT_TIMEOUT = 30000;
const DEFAULT_LOCAL_HOST_ADDRESS = "127.0.0.1";

export class AndroidLivesyncTool implements IAndroidLivesyncTool {
	private operationPromises: IDictionary<any>;
	private socketError: string | Error;
	private socketConnection: IDuplexSocket;
	private configuration: IAndroidLivesyncToolConfiguration;

	constructor(private $androidProcessService: Mobile.IAndroidProcessService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper) {
			this.operationPromises = Object.create(null);
			this.socketError = null;
			this.socketConnection = null;
	}

	public async connect(configuration: IAndroidLivesyncToolConfiguration): Promise<void> {
		if (!configuration.appIdentifier) {
			this.$errors.fail(`You need to provide "appIdentifier" as a configuration property!`);
		}

		if (!configuration.appPlatformsPath) {
			this.$errors.fail(`You need to provide "baseDir" as a configuration property!`);
		}

		if (this.socketConnection) {
			this.$errors.fail("Socket connection already exists.");
		}

		if (!configuration.localHostAddress) {
			configuration.localHostAddress = DEFAULT_LOCAL_HOST_ADDRESS;
		}

		this.configuration = configuration;
		this.socketError = null;

		const port = await this.$androidProcessService.forwardFreeTcpToAbstractPort({
			deviceIdentifier: configuration.deviceIdentifier,
			appIdentifier: configuration.appIdentifier,
			abstractPort: `localabstract:${configuration.appIdentifier}-livesync`
		});

		const connectionResult = await this.connectEventuallyUntilTimeout(this.createSocket.bind(this, port), TRY_CONNECT_TIMEOUT);
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

	public removeFile(filePath: string): Promise<boolean> {
		return new Promise((resolve: Function, reject: Function) => {
			this.verifyActiveConnection(reject);
			const filePathData = this.getFilePathData(filePath);
			const headerBuffer = Buffer.alloc(PROTOCOL_OPERATION_LENGTH_SIZE +
				SIZE_BYTE_LENGTH +
				filePathData.filePathLengthSize +
				filePathData.filePathLengthBytes);

			let offset = 0;
			offset += headerBuffer.write(DELETE_FILE_OPERATION.toString(), offset, PROTOCOL_OPERATION_LENGTH_SIZE);
			offset = headerBuffer.writeInt8(filePathData.filePathLengthSize, offset);
			offset += headerBuffer.write(filePathData.filePathLengthString, offset, filePathData.filePathLengthSize);
			headerBuffer.write(filePathData.relativeFilePath, offset, filePathData.filePathLengthBytes);
			const hash = crypto.createHash("md5").update(headerBuffer).digest();

			this.socketConnection.write(headerBuffer);
			this.socketConnection.write(hash, () => {
				resolve(true);
			});
		});
	}

	public removeFiles(files: string[]) {
		return Promise.all(files.map(file => this.removeFile(file)));
	}

	public generateOperationIdentifier(): string {
		return crypto.randomBytes(16).toString("hex");
	}

	public isOperationInProgress(operationId: string): boolean {
		return !!this.operationPromises[operationId];
	}

	public sendDoSyncOperation(operationId: string, timeout: number): Promise<IAndroidLivesyncSyncOperationResult> {
		const id = operationId || this.generateOperationIdentifier();
		const operationPromise: Promise<IAndroidLivesyncSyncOperationResult> = new Promise((resolve: Function, reject: Function) => {
			this.verifyActiveConnection(reject);

			const message = `${DO_SYNC_OPERATION}${id}`;
			const socketId = this.socketConnection.uid;
			const hash = crypto.createHash("md5").update(message).digest();

			this.operationPromises[id] = {
				resolve,
				reject,
				socketId
			};

			this.socketConnection.write(message);
			this.socketConnection.write(hash);

			setTimeout(() => {
				if (this.isOperationInProgress(id)) {
					this.handleSocketError(socketId, "Sync operation is taking too long");
				}
			}, SYNC_OPERATION_TIMEOUT);
		});

		return operationPromise;
	}

	public end() {
		if (this.socketConnection) {
			this.socketConnection.end();
		}
	}

	private sendFileHeader(filePath: string): Promise<void> {
		return new Promise((resolve, reject) => {
			let error;
			this.verifyActiveConnection(reject);
			const filePathData = this.getFilePathData(filePath);
			const stats = this.$fs.getFsStats(filePathData.filePath);
			const fileContentLengthBytes = stats.size;
			const fileContentLengthString = fileContentLengthBytes.toString();
			const fileContentLengthSize = Buffer.byteLength(fileContentLengthString);
			const headerBuffer = Buffer.alloc(PROTOCOL_OPERATION_LENGTH_SIZE +
					SIZE_BYTE_LENGTH +
					filePathData.filePathLengthSize +
					filePathData.filePathLengthBytes +
					SIZE_BYTE_LENGTH +
					fileContentLengthSize);

			if (filePathData.filePathLengthSize > 255) {
				error = this.getErrorWithMessage("File name size is longer that 255 digits.");
			} else if (fileContentLengthSize > 255) {
				error = this.getErrorWithMessage("File name size is longer that 255 digits.");
			}

			if (error) {
				reject(error);
			}

			let offset = 0;
			offset += headerBuffer.write(CREATE_FILE_OPERATION.toString(), offset, PROTOCOL_OPERATION_LENGTH_SIZE);
			offset = headerBuffer.writeUInt8(filePathData.filePathLengthSize, offset);
			offset += headerBuffer.write(filePathData.filePathLengthString, offset, filePathData.filePathLengthSize);
			offset += headerBuffer.write(filePathData.relativeFilePath, offset, filePathData.filePathLengthBytes);
			offset = headerBuffer.writeUInt8(fileContentLengthSize, offset);
			headerBuffer.write(fileContentLengthString, offset, fileContentLengthSize);
			const hash = crypto.createHash("md5").update(headerBuffer).digest();

			this.socketConnection.write(headerBuffer);
			this.socketConnection.write(hash);
			resolve();
		});
	}

	private sendFileContent(filePath: string): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.verifyActiveConnection(reject);
			const fileStream = this.$fs.createReadStream(filePath);
			const fileHash = crypto.createHash("md5");

			fileStream
				.on("data", (chunk: string | Buffer) => {
					fileHash.update(chunk);
					if (this.socketConnection) {
						this.socketConnection.write(chunk);
					} else {
						const error = this.checkConnectionStatus();
						//TODO Destroy method added in node 8.0.0.
						//when we depricate node 6.x uncoment the line belolw
						//fileStream.destroy(error);
						reject(error);
					}
				})
				.on("end", () => {
					if (this.socketConnection) {
						this.socketConnection.write(fileHash.digest(), () => {
							resolve(true);
						});
					} else {
						const error = this.checkConnectionStatus();
						reject(error);
					}
				})
				.on("error", (error: Error) => {
					reject(error);
				});
		});
	}

	private createSocket(port: number): IDuplexSocket {
		const socket = new net.Socket();
		socket.connect(port, this.configuration.localHostAddress);
		return socket;
	}

	private checkConnectionStatus() {
		if (this.socketConnection === null) {
			const defaultError = this.getErrorWithMessage("No socket connection available.");
			const error = this.socketError || defaultError;

			return error;
		}
	}

	private verifyActiveConnection(rejectHandler?: any) {
		const error = this.checkConnectionStatus();
		if (error && rejectHandler) {
			rejectHandler(error);
		}

		if (error && !rejectHandler) {
			this.$errors.failWithoutHelp(error.toString());
		}
	}

	private handleConnection({ socket, data }: { socket: IDuplexSocket, data: NodeBuffer | string }) {
		this.socketConnection = socket;
		this.socketConnection.uid = this.generateOperationIdentifier();

		const versionLength = (<NodeBuffer>data).readUInt8(0);
		const versionBuffer = data.slice(PROTOCOL_VERSION_LENGTH_SIZE, versionLength + PROTOCOL_VERSION_LENGTH_SIZE);
		const appIdentifierBuffer = data.slice(versionLength + PROTOCOL_VERSION_LENGTH_SIZE, data.length);

		const protocolVersion = versionBuffer.toString();
		const appIdentifier = appIdentifierBuffer.toString();
		this.$logger.trace(`Handle socket connection for app identifier: ${appIdentifier} with protocol version: ${protocolVersion}.`);

		this.socketConnection.on("data", (connectionData: NodeBuffer) => this.handleData(socket.uid, connectionData));
		this.socketConnection.on("close", (hasError: boolean) => this.handleSocketClose(socket.uid, hasError));
		this.socketConnection.on("error", (err: Error) => {
			const error = new Error(`Socket Error:\n${err}`);
			if (this.configuration.errorHandler) {
				this.configuration.errorHandler(error);
			} else {
				this.handleSocketError(socket.uid, error.message);
			}
		});
	}

	private connectEventuallyUntilTimeout(factory: () => IDuplexSocket, timeout: number): Promise<{socket: IDuplexSocket, data: NodeBuffer | string}> {
		return new Promise((resolve, reject) => {
			let lastKnownError: Error | string,
				isConnected = false;

			setTimeout(() => {
				if (!isConnected) {
					isConnected = true;
					reject(lastKnownError);
				}
			}, timeout);

			const tryConnect = () => {
				const tryConnectAfterTimeout = (error: Error) => {
					if (isConnected) {
						return;
					}

					if (typeof (error) === "boolean" && error) {
						error = new Error("Socket closed due to error");
					}

					lastKnownError = error;
					setTimeout(tryConnect, 1000);
				};

				const socket = factory();

				socket.once("data", data => {
					socket.removeListener("close", tryConnectAfterTimeout);
					socket.removeListener("error", tryConnectAfterTimeout);
					isConnected = true;
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

		if (reportType === ERROR_REPORT) {
			const errorMessage = infoBuffer.toString();
			this.handleSocketError(socketId, errorMessage);
		} else if (reportType === OPERATION_END_REPORT) {
			this.handleSyncEnd({data:infoBuffer, didRefresh: true});
		} else if (reportType === OPERATION_END_NO_REFRESH_REPORT_CODE) {
			this.handleSyncEnd({data:infoBuffer, didRefresh: false});
		}
	}

	private handleSyncEnd({data, didRefresh}: {data: any, didRefresh: boolean}) {
		const operationId = data.toString();
		const promiseHandler = this.operationPromises[operationId];

		if (promiseHandler) {
			promiseHandler.resolve({operationId, didRefresh});
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
			this.end();
			this.socketConnection = null;
			this.socketError = error;
		}

		_.keys(this.operationPromises)
			.forEach(operationId => {
				const operationPromise = this.operationPromises[operationId];
				if (operationPromise.socketId === socketId) {
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

	private getFilePathData(filePath: string): { relativeFilePath: string, filePathLengthBytes: number, filePathLengthString: string, filePathLengthSize: number, filePath: string } {
		const relativeFilePath = this.resolveRelativePath(filePath);
		const filePathLengthBytes = Buffer.byteLength(relativeFilePath);
		const filePathLengthString = filePathLengthBytes.toString();
		const filePathLengthSize = Buffer.byteLength(filePathLengthString);

		return {
			relativeFilePath,
			filePathLengthBytes,
			filePathLengthString,
			filePathLengthSize,
			filePath
		};
	}

	private resolveRelativePath(filePath: string): string {
		const relativeFilePath = path.relative(this.configuration.appPlatformsPath, filePath);

		return this.$mobileHelper.buildDevicePath(relativeFilePath);
	}
}
$injector.register("androidLivesyncTool", AndroidLivesyncTool);
