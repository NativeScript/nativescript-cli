import * as path from "path";
import { ITMSConstants, INFO_PLIST_FILE_NAME } from "../constants";
import { quoteString } from "../common/helpers";
import { cache } from "../common/decorators";
import { IITMSTransporterService, IITMSData } from "../declarations";
import { IProjectData } from "../definitions/project";
import {
	IChildProcess,
	IErrors,
	IFileSystem,
	IPlistParser,
	IXcodeSelectService,
} from "../common/declarations";
import { IApplePortalApplicationService } from "./apple-portal/definitions";
import { IInjector } from "../common/definitions/yok";
import { injector } from "../common/yok";
import { ITempService } from "../definitions/temp-service";

export class ITMSTransporterService implements IITMSTransporterService {
	constructor(
		private $applePortalApplicationService: IApplePortalApplicationService,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $logger: ILogger,
		private $plistParser: IPlistParser,
		private $xcodeSelectService: IXcodeSelectService,
		private $tempService: ITempService
	) {}

	private get $projectData(): IProjectData {
		return this.$injector.resolve("projectData");
	}

	public async validate(appSpecificPassword?: string): Promise<void> {
		const itmsTransporterPath = await this.getITMSTransporterPath();
		var version = await this.$xcodeSelectService.getXcodeVersion();
		if (+version.major < 14) {
			if (!this.$fs.exists(itmsTransporterPath)) {
				this.$errors.fail(
					"iTMS Transporter not found on this machine - make sure your Xcode installation is not damaged."
				);
			}
		} else {
			const altoolPath = await this.getAltoolPath();
			if (!this.$fs.exists(altoolPath)) {
				this.$errors.fail(
					"altool not found on this machine - make sure your Xcode installation is not damaged."
				);
			}
			if (!appSpecificPassword) {
				this.$errors.fail(
					"An app-specific password is required from xCode versions 14 and above, Use the --appleApplicationSpecificPassword to supply it."
				);
			}
		}
	}
	public async upload(data: IITMSData): Promise<void> {
		var version = await this.$xcodeSelectService.getXcodeVersion();
		if (+version.major < 14) {
			await this.upload_iTMSTransporter(data);
		} else {
			await this.upload_altool(data);
		}
	}
	public async upload_iTMSTransporter(data: IITMSData): Promise<void> {
		const itmsTransporterPath = await this.getITMSTransporterPath();
		const ipaFileName = "app.ipa";
		const itmsDirectory = await this.$tempService.mkdirSync("itms-");
		const innerDirectory = path.join(itmsDirectory, "mybundle.itmsp");
		const ipaFileLocation = path.join(innerDirectory, ipaFileName);
		const loggingLevel = data.verboseLogging
			? ITMSConstants.VerboseLoggingLevels.Verbose
			: ITMSConstants.VerboseLoggingLevels.Informational;
		const bundleId = await this.getBundleIdentifier(data);
		const application = await this.$applePortalApplicationService.getApplicationByBundleId(
			data.user,
			bundleId
		);

		this.$fs.createDirectory(innerDirectory);

		this.$fs.copyFile(data.ipaFilePath, ipaFileLocation);

		const ipaFileHash = await this.$fs.getFileShasum(ipaFileLocation, {
			algorithm: "md5",
		});
		const ipaFileSize = this.$fs.getFileSize(ipaFileLocation);
		const metadata = this.getITMSMetadataXml(
			application.adamId,
			ipaFileName,
			ipaFileHash,
			ipaFileSize
		);

		this.$fs.writeFile(
			path.join(innerDirectory, ITMSConstants.ApplicationMetadataFile),
			metadata
		);

		const password = data.user.isTwoFactorAuthenticationEnabled
			? data.applicationSpecificPassword
			: data.credentials.password;
		await this.$childProcess.spawnFromEvent(
			itmsTransporterPath,
			[
				"-m",
				"upload",
				"-f",
				itmsDirectory,
				"-u",
				quoteString(data.credentials.username),
				"-p",
				quoteString(password),
				"-v",
				loggingLevel,
			],
			"close",
			{ stdio: "inherit" }
		);
	}

	public async upload_altool(data: IITMSData): Promise<void> {
		const altoolPath = await this.getAltoolPath();
		const ipaFileName = "app.ipa";
		const itmsDirectory = await this.$tempService.mkdirSync("itms-");
		const innerDirectory = path.join(itmsDirectory, "mybundle.itmsp");
		const ipaFileLocation = path.join(innerDirectory, ipaFileName);

		this.$fs.createDirectory(innerDirectory);

		this.$fs.copyFile(data.ipaFilePath, ipaFileLocation);

		const password = data.user.isTwoFactorAuthenticationEnabled
			? data.applicationSpecificPassword
			: data.credentials.password;

		const args = [
			"--upload-app",
			"-t",
			"ios",
			"-f",
			ipaFileLocation,
			"-u",
			data.credentials.username,
			"-p",
			password,
			"-k 100000",
		];

		if (data.teamId) {
			args.push("--asc-provider");
			args.push(data.teamId);
		}
		console.log("****Verbose loggin is ", data.verboseLogging);
		if (data.verboseLogging) {
			args.push("--verbose");
		}

		await this.$childProcess.spawnFromEvent(altoolPath, args, "close", {
			stdio: "inherit",
		});
	}

	private async getBundleIdentifier(data: IITMSData): Promise<string> {
		const { shouldExtractIpa, ipaFilePath } = data;

		if (shouldExtractIpa) {
			if (
				!this.$fs.exists(ipaFilePath) ||
				path.extname(ipaFilePath) !== ".ipa"
			) {
				this.$errors.fail(
					`Cannot use specified ipa file ${ipaFilePath}. File either does not exist or is not an ipa file.`
				);
			}

			this.$logger.trace(
				"--ipa set - extracting .ipa file to get app's bundle identifier"
			);
			const destinationDir = await this.$tempService.mkdirSync("ipa-");
			await this.$fs.unzip(ipaFilePath, destinationDir);

			const payloadDir = path.join(destinationDir, "Payload");
			let allFiles = this.$fs.readDirectory(payloadDir);

			this.$logger.debug("ITMSTransporter .ipa Payload files:");
			allFiles.forEach((f) => this.$logger.debug(" - " + f));

			allFiles = allFiles.filter(
				(f) => path.extname(f).toLowerCase() === ".app"
			);
			if (allFiles.length > 1) {
				this.$errors.fail(
					"In the .ipa the ITMSTransporter is uploading there is more than one .app file. We don't know which one to upload."
				);
			} else if (allFiles.length <= 0) {
				this.$errors.fail(
					"In the .ipa the ITMSTransporter is uploading there must be at least one .app file."
				);
			}
			const appFile = path.join(payloadDir, allFiles[0]);

			const plistObject = await this.$plistParser.parseFile(
				path.join(appFile, INFO_PLIST_FILE_NAME)
			);
			const bundleId = plistObject && plistObject.CFBundleIdentifier;
			if (!bundleId) {
				this.$errors.fail(
					`Unable to determine bundle identifier from ${ipaFilePath}.`
				);
			}

			this.$logger.trace(`bundle identifier determined to be ${bundleId}`);

			return bundleId;
		}

		return this.$projectData.projectIdentifiers.ios;
	}

	@cache()
	private async getAltoolPath(): Promise<string> {
		const xcodePath = await this.$xcodeSelectService.getContentsDirectoryPath();
		let itmsTransporterPath = path.join(
			xcodePath,
			"..",
			"Contents",
			"Developer",
			"usr",
			"bin",
			ITMSConstants.altoolExecutableName
		);

		return itmsTransporterPath;
	}

	@cache()
	private async getITMSTransporterPath(): Promise<string> {
		const xcodePath = await this.$xcodeSelectService.getContentsDirectoryPath();
		let itmsTransporterPath = path.join(
			xcodePath,
			"..",
			"Contents",
			"SharedFrameworks",
			"ContentDeliveryServices.framework",
			"Versions",
			"A",
			"itms",
			"bin",
			ITMSConstants.iTMSExecutableName
		);

		const xcodeVersionData = await this.$xcodeSelectService.getXcodeVersion();
		if (+xcodeVersionData.major < 11) {
			const loaderAppContentsPath = path.join(
				xcodePath,
				"Applications",
				"Application Loader.app",
				"Contents"
			);
			itmsTransporterPath = path.join(
				loaderAppContentsPath,
				ITMSConstants.iTMSDirectoryName,
				"bin",
				ITMSConstants.iTMSExecutableName
			);
		}

		return itmsTransporterPath;
	}

	private getITMSMetadataXml(
		appleId: string,
		ipaFileName: string,
		ipaFileHash: string,
		ipaFileSize: number
	): string {
		return `<?xml version="1.0" encoding="UTF-8"?>
<package version="software4.7" xmlns="http://apple.com/itunes/importer">
    <software_assets apple_id="${appleId}">
        <asset type="bundle">
            <data_file>
                <file_name>${ipaFileName}</file_name>
                <checksum type="md5">${ipaFileHash}</checksum>
                <size>${ipaFileSize}</size>
            </data_file>
        </asset>
    </software_assets>
</package>`;
	}
}
injector.register("itmsTransporterService", ITMSTransporterService);
