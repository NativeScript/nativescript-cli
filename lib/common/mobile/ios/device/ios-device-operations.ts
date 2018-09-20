import { IOSDeviceLib as IOSDeviceLibModule } from "ios-device-lib";
import { cache } from "../../../decorators";
import { DEVICE_LOG_EVENT_NAME } from "../../../constants";
import assert = require("assert");
import { EventEmitter } from "events";

export class IOSDeviceOperations extends EventEmitter implements IIOSDeviceOperations, IDisposable, IShouldDispose {
	public isInitialized: boolean;
	public shouldDispose: boolean;
	private deviceLib: IOSDeviceLib.IOSDeviceLib;

	constructor(private $logger: ILogger,
		private $processService: IProcessService) {
		super();

		this.isInitialized = false;
		this.shouldDispose = true;
		this.$processService.attachToProcessExitSignals(this, () => {
			this.setShouldDispose(true);
			this.dispose();
		});
	}

	public async install(ipaPath: string, deviceIdentifiers: string[], errorHandler: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();
		this.$logger.trace(`Installing ${ipaPath} on devices with identifiers: ${deviceIdentifiers}.`);
		return await this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.install(ipaPath, deviceIdentifiers), errorHandler);
	}

	public async uninstall(appIdentifier: string, deviceIdentifiers: string[], errorHandler: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();
		this.$logger.trace(`Uninstalling ${appIdentifier} from devices with identifiers: ${deviceIdentifiers}.`);
		return await this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.uninstall(appIdentifier, deviceIdentifiers), errorHandler);
	}

	@cache()
	public async startLookingForDevices(deviceFoundCallback: DeviceInfoCallback, deviceLostCallback: DeviceInfoCallback, options?: Mobile.IDeviceLookingOptions): Promise<void> {
		this.$logger.trace("Starting to look for iOS devices.");
		this.isInitialized = true;
		if (!this.deviceLib) {
			let foundDevice = false;
			const wrappedDeviceFoundCallback = (deviceInfo: IOSDeviceLib.IDeviceActionInfo) => {
				foundDevice = true;

				return deviceFoundCallback(deviceInfo);
			};

			this.deviceLib = new IOSDeviceLibModule(wrappedDeviceFoundCallback, deviceLostCallback);
			if (options && options.shouldReturnImmediateResult) {
				return;
			}

			// We need this because we need to make sure that we have devices.
			await new Promise((resolve, reject) => {
				let iterationsCount = 0;
				const maxIterationsCount = 3;

				const intervalHandle: NodeJS.Timer = setInterval(() => {
					if (foundDevice) {
						resolve();
						return clearInterval(intervalHandle);
					}

					iterationsCount++;
					if (iterationsCount >= maxIterationsCount) {
						clearInterval(intervalHandle);
						return resolve();
					}
				}, 2000);
			});
		}
	}

	public startDeviceLog(deviceIdentifier: string): void {
		this.assertIsInitialized();
		this.setShouldDispose(false);

		this.$logger.trace(`Printing device log for device with identifier: ${deviceIdentifier}.`);

		this.attacheDeviceLogDataHandler();

		this.deviceLib.startDeviceLog([deviceIdentifier]);
	}

	public async apps(deviceIdentifiers: string[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceAppInfo> {
		this.assertIsInitialized();
		this.$logger.trace(`Getting applications information for devices with identifiers: ${deviceIdentifiers}`);
		return this.getMultipleResults(() => this.deviceLib.apps(deviceIdentifiers), errorHandler);
	}

	public async listDirectory(listArray: IOSDeviceLib.IReadOperationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceMultipleResponse> {
		this.assertIsInitialized();

		_.each(listArray, l => {
			this.$logger.trace(`Listing directory: ${l.path} for application ${l.appId} on device with identifier: ${l.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceMultipleResponse>(() => this.deviceLib.list(listArray), errorHandler);
	}

	public async readFiles(deviceFilePaths: IOSDeviceLib.IReadOperationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(deviceFilePaths, p => {
			this.$logger.trace(`Reading file: ${p.path} from application ${p.appId} on device with identifier: ${p.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.read(deviceFilePaths), errorHandler);
	}

	public async downloadFiles(deviceFilePaths: IOSDeviceLib.IFileOperationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(deviceFilePaths, d => {
			this.$logger.trace(`Downloading file: ${d.source} from application ${d.appId} on device with identifier: ${d.deviceId} to ${d.destination}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.download(deviceFilePaths), errorHandler);
	}

	public uploadFiles(files: IOSDeviceLib.IUploadFilesData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(files, f => {
			this.$logger.trace("Uploading files:");
			this.$logger.trace(f.files);
			this.$logger.trace(`For application ${f.appId} on device with identifier: ${f.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.upload(files), errorHandler);
	}

	public async deleteFiles(deleteArray: IOSDeviceLib.IDeleteFileData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(deleteArray, d => {
			this.$logger.trace(`Deleting file: ${d.destination} from application ${d.appId} on device with identifier: ${d.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.delete(deleteArray), errorHandler);
	}

	public async start(startArray: IOSDeviceLib.IDdiApplicationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(startArray, s => {
			this.$logger.trace(`Starting application ${s.appId} on device with identifier: ${s.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.start(startArray), errorHandler);
	}

	public async stop(stopArray: IOSDeviceLib.IDdiApplicationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(stopArray, s => {
			this.$logger.trace(`Stopping application ${s.appId} on device with identifier: ${s.deviceId}.`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.stop(stopArray), errorHandler);
	}

	public dispose(signal?: string): void {
		// We need to check if we should dispose the device lib.
		// For example we do not want to dispose it when we start printing the device logs.
		if (this.shouldDispose && this.deviceLib) {
			this.deviceLib.removeAllListeners();
			this.deviceLib.dispose(signal);
			this.deviceLib = null;
			this.$logger.trace("IOSDeviceOperations disposed.");
		}
	}

	public async postNotification(postNotificationArray: IOSDeviceLib.IPostNotificationData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(postNotificationArray, n => {
			this.$logger.trace(`Sending notification ${n.notificationName} to device with identifier: ${n.deviceId}`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.postNotification(postNotificationArray), errorHandler);
	}

	public async awaitNotificationResponse(awaitNotificationResponseArray: IOSDeviceLib.IAwaitNotificatioNResponseData[], errorHandler?: DeviceOperationErrorHandler): Promise<IOSDeviceResponse> {
		this.assertIsInitialized();

		_.each(awaitNotificationResponseArray, n => {
			this.$logger.trace(`Awaiting notification response from socket: ${n.socket} with timeout: ${n.timeout}`);
		});

		return this.getMultipleResults<IOSDeviceLib.IDeviceResponse>(() => this.deviceLib.awaitNotificationResponse(awaitNotificationResponseArray), errorHandler);
	}

	public async connectToPort(connectToPortArray: IOSDeviceLib.IConnectToPortData[], errorHandler?: DeviceOperationErrorHandler): Promise<IDictionary<IOSDeviceLib.IConnectToPortResponse[]>> {
		this.assertIsInitialized();

		_.each(connectToPortArray, c => {
			this.$logger.trace(`Connecting to port ${c.port} on device with identifier: ${c.deviceId}`);
		});

		return this.getMultipleResults<IOSDeviceLib.IConnectToPortResponse>(() => this.deviceLib.connectToPort(connectToPortArray), errorHandler);
	}

	public setShouldDispose(shouldDispose: boolean): void {
		this.shouldDispose = shouldDispose;
	}

	private async getMultipleResults<T>(getPromisesMethod: () => Promise<T>[], errorHandler?: DeviceOperationErrorHandler): Promise<IDictionary<T[]>> {
		const result: T[] = [];
		const promises = getPromisesMethod();

		for (const promise of promises) {
			if (errorHandler) {
				try {
					result.push(await promise);
				} catch (err) {
					this.$logger.trace(`Error while executing ios device operation: ${err.message} with code: ${err.code}`);
					errorHandler(err);
				}
			} else {
				result.push(await promise);
			}
		}

		const groupedResults = _.groupBy(result, r => (<any>r).deviceId);
		this.$logger.trace("Received multiple results:");
		this.$logger.trace(groupedResults);

		return groupedResults;
	}

	private assertIsInitialized(): void {
		assert.ok(this.isInitialized, "iOS device operations not initialized.");
	}

	@cache()
	private attacheDeviceLogDataHandler(): void {
		this.deviceLib.on(DEVICE_LOG_EVENT_NAME, (response: IOSDeviceLib.IDeviceLogData) => {
			this.emit(DEVICE_LOG_EVENT_NAME, response);
		});
	}
}

$injector.register("iosDeviceOperations", IOSDeviceOperations);
