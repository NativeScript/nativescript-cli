import * as path from "path";

import { IOSDeviceLiveSyncService } from "./ios-device-livesync-service";
import { PlatformLiveSyncServiceBase } from "./platform-livesync-service-base";
import { APP_FOLDER_NAME } from "../../constants";
import { LiveSyncPaths } from "../../common/constants";
import { performanceLog } from "../../common/decorators";
import { IPlatformsDataService } from "../../definitions/platform";
import {
	IFileSystem,
	IProjectFilesManager,
	IProjectDir,
} from "../../common/declarations";
import { IInjector } from "../../common/definitions/yok";
import { injector } from "../../common/yok";
import { ITempService } from "../../definitions/temp-service";
import { IOptions } from "../../declarations";

export class IOSLiveSyncService
	extends PlatformLiveSyncServiceBase
	implements IPlatformLiveSyncService
{
	constructor(
		protected $fs: IFileSystem,
		protected $platformsDataService: IPlatformsDataService,
		protected $projectFilesManager: IProjectFilesManager,
		private $injector: IInjector,
		private $tempService: ITempService,
		$devicePathProvider: IDevicePathProvider,
		$logger: ILogger,
		$options: IOptions,
	) {
		super(
			$fs,
			$logger,
			$platformsDataService,
			$projectFilesManager,
			$devicePathProvider,
			$options,
		);
	}

	@performanceLog()
	public async fullSync(syncInfo: IFullSyncInfo): Promise<ILiveSyncResultInfo> {
		const device = syncInfo.device;

		if (device.isEmulator) {
			return super.fullSync(syncInfo);
		}
		const projectData = syncInfo.projectData;
		const platformData = this.$platformsDataService.getPlatformData(
			device.deviceInfo.platform,
			projectData,
		);
		const deviceAppData = await this.getAppData(syncInfo);
		const projectFilesPath = path.join(
			platformData.appDestinationDirectoryPath,
			APP_FOLDER_NAME,
		);

		const tempZip = await this.$tempService.path({
			prefix: "sync",
			suffix: ".zip",
		});
		this.$logger.trace("Creating zip file: " + tempZip);

		const filesToTransfer =
			this.$fs.enumerateFilesInDirectorySync(projectFilesPath);

		await this.$fs.zipFiles(tempZip, filesToTransfer, (res) => {
			return path.join(APP_FOLDER_NAME, path.relative(projectFilesPath, res));
		});

		const deviceProjectRootPath =
			await deviceAppData.getDeviceProjectRootPath();
		const transferSyncZip = () =>
			device.fileSystem.transferFiles(deviceAppData, [
				{
					getLocalPath: () => tempZip,
					getDevicePath: () => deviceAppData.deviceSyncZipPath,
					getRelativeToProjectBasePath: () => "../sync.zip",
					deviceProjectRootPath,
				},
			]);

		// ── Fail-closed delivery verification ──────────────────────────
		//
		// The AFC transfer has been observed to fail without surfacing an
		// error, leaving the app to boot the stale JavaScript baked into
		// the installed .app payload with no indication anywhere that the
		// sync was lost. After the transfer we therefore confirm the zip
		// is actually present in the app sandbox; one retry covers
		// transient AFC hiccups, and an unconfirmed delivery fails the
		// sync loudly instead of printing "Successfully synced" over
		// stale code (the run-controller surfaces the error; --clean
		// reinstalls the full package).
		//
		// Presence alone is NOT sufficient evidence: a previous run that
		// transferred the zip but aborted before the app restarted leaves
		// a LEFTOVER sync.zip behind (the runtime only consumes it at
		// boot), which would satisfy the check even when THIS upload
		// failed. So any pre-existing zip is deleted up front — after
		// that, post-transfer presence can only be produced by this run's
		// upload.
		//
		// NOTE: deviceProjectRootPath is `.../LiveSync/app` (the extracted
		// app folder); the zip is uploaded one level up, at the LiveSync
		// root — the listing targets THAT directory.
		//
		// Escape hatch: NS_SKIP_IOS_SYNC_VERIFICATION=1 disables the
		// whole verification for exotic setups where directory listing
		// misbehaves but uploads are known-good.
		const syncZipDevicePath = deviceAppData.deviceSyncZipPath;
		const verificationSupported =
			!!device.fileSystem.getDirectoryEntries &&
			process.env.NS_SKIP_IOS_SYNC_VERIFICATION !== "1";
		const listLiveSyncRoot = (): Promise<string[] | null> =>
			device.fileSystem.getDirectoryEntries(
				LiveSyncPaths.IOS_DEVICE_PROJECT_ROOT_PATH,
				deviceAppData.appIdentifier,
			);
		// Entry shape: ios-device-lib's native `read_dir` recursively joins
		// `<requested dir>/<entry>` and returns FULL paths rooted at the
		// requested directory (verified against IOSDeviceLib.cpp and live
		// device output), so the canonical match is exact equality with
		// `Library/Application Support/LiveSync/sync.zip`. The bare
		// `"sync.zip"` equality is defensive cover for listing
		// implementations that return root-relative names. Deliberately NO
		// suffix matching — `endsWith("/sync.zip")` would false-positively
		// accept a nested app asset like `.../LiveSync/app/sync.zip`.
		const containsSyncZip = (entries: string[]): boolean =>
			entries.some(
				(entry) => entry === syncZipDevicePath || entry === "sync.zip",
			);
		// "delivered" / "missing" are definitive listings; "unknown" means
		// the listing itself could not be read (after one retry).
		const checkDelivery = async (): Promise<
			"delivered" | "missing" | "unknown"
		> => {
			let entries = await listLiveSyncRoot();
			if (entries === null) {
				entries = await listLiveSyncRoot();
			}
			if (entries === null) {
				return "unknown";
			}
			return containsSyncZip(entries) ? "delivered" : "missing";
		};

		let preListingAvailable = false;
		let leftoverZipPresent = false;
		if (verificationSupported) {
			// Clear any leftover zip so the post-transfer check attributes
			// presence to this run. Best-effort: AFC "file not found" is
			// tolerated inside deleteFile.
			await device.fileSystem.deleteFile(
				syncZipDevicePath,
				deviceAppData.appIdentifier,
			);
			const preEntries = await listLiveSyncRoot();
			preListingAvailable = Array.isArray(preEntries);
			leftoverZipPresent = preListingAvailable && containsSyncZip(preEntries);
		}

		await transferSyncZip();

		if (verificationSupported) {
			if (leftoverZipPresent) {
				// The pre-transfer delete did not take effect, so presence
				// can no longer be attributed to this run. Most likely the
				// upload succeeded too, but say so explicitly rather than
				// claim verification.
				this.$logger.warn(
					"A leftover sync.zip from a previous run could not be removed — delivery verification for this sync is inconclusive. " +
						"If the app runs stale code, re-run the command or use a clean rebuild (--clean).",
				);
			} else {
				let state = await checkDelivery();
				if (state === "missing") {
					this.$logger.warn(
						"sync.zip was not found on the device after transfer — retrying once...",
					);
					await transferSyncZip();
					state = await checkDelivery();
					if (state === "delivered") {
						this.$logger.info("sync.zip delivered on retry.");
					}
				}
				if (state === "missing") {
					throw new Error(
						`Unable to deliver the application payload (sync.zip) to device ${device.deviceInfo.identifier}. ` +
							`The app would run stale JavaScript without it. ` +
							`Re-run the command, or use a clean rebuild (--clean) to reinstall the full application package.`,
					);
				}
				if (state === "unknown") {
					if (preListingAvailable) {
						// The listing worked moments before the upload and
						// broke right after it — the AFC session is
						// misbehaving at exactly the point where the upload
						// itself is suspect. Fail closed.
						throw new Error(
							`Unable to confirm delivery of the application payload (sync.zip) to device ${device.deviceInfo.identifier}: ` +
								`the device directory listing failed right after the transfer. ` +
								`Re-run the command, or use a clean rebuild (--clean) to reinstall the full application package. ` +
								`(Set NS_SKIP_IOS_SYNC_VERIFICATION=1 to bypass delivery verification.)`,
						);
					}
					// Listing was unavailable both before and after the
					// transfer — verification is unsupported for this
					// device/session. This is the single fail-open path,
					// and it is loud rather than silent.
					this.$logger.warn(
						"Could not verify sync.zip delivery (device directory listing unavailable). " +
							"If the transfer failed, the app will run stale JavaScript — re-run the command or use a clean rebuild (--clean).",
					);
				}
			}
		}

		await deviceAppData.device.applicationManager.setTransferredAppFiles(
			filesToTransfer,
		);

		return {
			deviceAppData,
			isFullSync: true,
			modifiedFilesData: [],
			useHotModuleReload: syncInfo.useHotModuleReload,
		};
	}

	public async syncAfterInstall(
		device: Mobile.IDevice,
		liveSyncInfo: ILiveSyncWatchInfo,
	): Promise<void> {
		if (!device.isEmulator) {
			// In this case we should execute fullsync because iOS Runtime requires the full content of app dir to be extracted in the root of sync dir.
			await this.fullSync({
				projectData: liveSyncInfo.projectData,
				device,
				liveSyncDeviceData: liveSyncInfo.liveSyncDeviceData,
				watch: true,
				useHotModuleReload: liveSyncInfo.useHotModuleReload,
			});
		}
	}

	protected _getDeviceLiveSyncService(
		device: Mobile.IDevice,
		data: IProjectDir,
	): INativeScriptDeviceLiveSyncService {
		const service = this.$injector.resolve<INativeScriptDeviceLiveSyncService>(
			IOSDeviceLiveSyncService,
			{ device, data },
		);
		return service;
	}
}
injector.register("iOSLiveSyncService", IOSLiveSyncService);
