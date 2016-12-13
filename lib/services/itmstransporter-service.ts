import * as path from "path";
import * as temp from "temp";
import {EOL} from "os";
import {ITMSConstants} from "../constants";
import {ItunesConnectApplicationTypes} from "../constants";
import {quoteString, versionCompare} from "../common/helpers";

export class ITMSTransporterService implements IITMSTransporterService {
	private _itmsTransporterPath: string = null;
	private _itunesConnectApplications: IiTunesConnectApplication[] = null;
	private _bundleIdentifier: string = null;

	constructor(private $bplistParser: IBinaryPlistParser,
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $hostInfo: IHostInfo,
		private $httpClient: Server.IHttpClient,
		private $injector: IInjector,
		private $logger: ILogger,
		private $xcodeSelectService: IXcodeSelectService) { }

	private get $projectData(): IProjectData {
		return this.$injector.resolve("projectData");
	}

	public upload(data: IITMSData): IFuture<void> {
		return (() => {
			if (!this.$hostInfo.isDarwin) {
				this.$errors.failWithoutHelp("iOS publishing is only available on Mac OS X.");
			}

			temp.track();
			let itmsTransporterPath = this.getITMSTransporterPath().wait(),
				ipaFileName = "app.ipa",
				itmsDirectory = temp.mkdirSync("itms-"),
				innerDirectory = path.join(itmsDirectory, "mybundle.itmsp"),
				ipaFileLocation = path.join(innerDirectory, ipaFileName),
				loggingLevel = data.verboseLogging ? ITMSConstants.VerboseLoggingLevels.Verbose : ITMSConstants.VerboseLoggingLevels.Informational,
				bundleId = this.getBundleIdentifier(data.ipaFilePath).wait(),
				iOSApplication = this.getiOSApplication(data.username, data.password, bundleId).wait();

			this.$fs.createDirectory(innerDirectory);

			this.$fs.copyFile(data.ipaFilePath, ipaFileLocation);

			let ipaFileHash = this.$fs.getFileShasum(ipaFileLocation, {algorithm: "md5"}).wait(),
				ipaFileSize = this.$fs.getFileSize(ipaFileLocation),
				metadata = this.getITMSMetadataXml(iOSApplication.adamId, ipaFileName, ipaFileHash, ipaFileSize);

			this.$fs.writeFile(path.join(innerDirectory, ITMSConstants.ApplicationMetadataFile), metadata);

			this.$childProcess.spawnFromEvent(itmsTransporterPath, ["-m", "upload", "-f", itmsDirectory, "-u", quoteString(data.username), "-p", quoteString(data.password), "-v", loggingLevel], "close", { stdio: "inherit" }).wait();
		}).future<void>()();
	}

	public getiOSApplications(credentials: ICredentials): IFuture<IiTunesConnectApplication[]> {
		return ((): IiTunesConnectApplication[] => {
			if (!this._itunesConnectApplications) {
				let requestBody = this.getContentDeliveryRequestBody(credentials),
					contentDeliveryResponse = this.$httpClient.httpRequest({
							url: "https://contentdelivery.itunes.apple.com/WebObjects/MZLabelService.woa/json/MZITunesProducerService",
							method: "POST",
							body: requestBody
						}).wait(),
					contentDeliveryBody: IContentDeliveryBody = JSON.parse(contentDeliveryResponse.body);

				if (!contentDeliveryBody.result.Success || !contentDeliveryBody.result.Applications) {
					let errorMessage = ["Unable to connect to iTunes Connect"];
					if (contentDeliveryBody.result.Errors && contentDeliveryBody.result.Errors.length) {
						errorMessage = errorMessage.concat(contentDeliveryBody.result.Errors);
					}

					this.$errors.failWithoutHelp(errorMessage.join(EOL));
				}

				this._itunesConnectApplications = contentDeliveryBody.result.Applications.filter(app => app.type === ItunesConnectApplicationTypes.iOS);
			}

			return this._itunesConnectApplications;
		}).future<IiTunesConnectApplication[]>()();
	}

	/**
	 * Gets iTunes Connect application corresponding to the given bundle identifier.
	 * @param  {string}                             username For authentication with iTunes Connect.
	 * @param  {string}                             password For authentication with iTunes Connect.
	 * @param  {string}                             bundleId Application's Bundle Identifier
	 * @return {IFuture<IiTunesConnectApplication>}          The iTunes Connect application.
	 */
	private getiOSApplication(username: string, password: string, bundleId: string) : IFuture<IiTunesConnectApplication> {
		return (():IiTunesConnectApplication => {
			let iOSApplications = this.getiOSApplications({username, password}).wait();
			if (!iOSApplications || !iOSApplications.length) {
				this.$errors.failWithoutHelp(`Cannot find any registered applications for Apple ID ${username} in iTunes Connect.`);
			}

			let iOSApplication = _.find(iOSApplications, app => app.bundleId === bundleId);

			if (!iOSApplication) {
				this.$errors.failWithoutHelp(`Cannot find registered applications that match the specified identifier ${bundleId} in iTunes Connect.`);
			}

			return iOSApplication;
		}).future<IiTunesConnectApplication>()();
	}

	/**
	 * Gets the application's bundle identifier. If ipaFileFullPath is provided will extract the bundle identifier from the .ipa file.
	 * @param  {string}          ipaFileFullPath Optional full path to .ipa file
	 * @return {IFuture<string>}                 Application's bundle identifier.
	 */
	private getBundleIdentifier(ipaFileFullPath?: string): IFuture<string> {
		return ((): string => {
			if (!this._bundleIdentifier) {
				if (!ipaFileFullPath) {
					this._bundleIdentifier = this.$projectData.projectId;
				} else {
					if (!this.$fs.exists(ipaFileFullPath) || path.extname(ipaFileFullPath) !== ".ipa") {
						this.$errors.failWithoutHelp(`Cannot use specified ipa file ${ipaFileFullPath}. File either does not exist or is not an ipa file.`);
					}

					this.$logger.trace("--ipa set - extracting .ipa file to get app's bundle identifier");
					temp.track();
					let destinationDir = temp.mkdirSync("ipa-");
					this.$fs.unzip(ipaFileFullPath, destinationDir).wait();

					let payloadDir = path.join(destinationDir, "Payload");
					let allApps = this.$fs.readDirectory(payloadDir);

					this.$logger.debug("ITMSTransporter .ipa Payload files:");
					allApps.forEach(f => this.$logger.debug(" - " + f));

					allApps = allApps.filter(f => path.extname(f).toLowerCase() === ".app");
					if (allApps.length > 1) {
						this.$errors.failWithoutHelp("In the .ipa the ITMSTransporter is uploading there is more than one .app file. We don't know which one to upload.");
					} else if (allApps.length <= 0) {
						this.$errors.failWithoutHelp("In the .ipa the ITMSTransporter is uploading there must be at least one .app file.");
					}
					let appFile = path.join(payloadDir, allApps[0]);

					let plistObject = this.$bplistParser.parseFile(path.join(appFile, "Info.plist")).wait();
					let bundleId = plistObject && plistObject[0] && plistObject[0].CFBundleIdentifier;
					if (!bundleId) {
						this.$errors.failWithoutHelp(`Unable to determine bundle identifier from ${ipaFileFullPath}.`);
					}

					this.$logger.trace(`bundle identifier determined to be ${bundleId}`);
					this._bundleIdentifier = bundleId;
				}
			}

			return this._bundleIdentifier;
		}).future<string>()();
	}

	private getITMSTransporterPath(): IFuture<string> {
		return ((): string => {
			if (!this._itmsTransporterPath) {
				let xcodePath = this.$xcodeSelectService.getContentsDirectoryPath().wait(),
					xcodeVersion = this.$xcodeSelectService.getXcodeVersion().wait(),
					result = path.join(xcodePath, "Applications", "Application Loader.app", "Contents");

				xcodeVersion.patch = xcodeVersion.patch || "0";
				// iTMS Transporter's path has been modified in Xcode 6.3
				// https://github.com/nomad/shenzhen/issues/243
				if (xcodeVersion.major && xcodeVersion.minor &&
					versionCompare(xcodeVersion, "6.3.0") < 0) {
						result = path.join(result, "MacOS");
				}

				this._itmsTransporterPath = path.join(result, ITMSConstants.iTMSDirectoryName, "bin", ITMSConstants.iTMSExecutableName);
			}

			if(!this.$fs.exists(this._itmsTransporterPath)) {
				this.$errors.failWithoutHelp('iTMS Transporter not found on this machine - make sure your Xcode installation is not damaged.');
			}

			return this._itmsTransporterPath;
		}).future<string>()();
	}

	private getContentDeliveryRequestBody(credentials: ICredentials): string {
		// All of those values except credentials are hardcoded
		// Apple's content delivery API is very picky with handling requests
		// and if only one of these ends up missing the API returns
		// a response with 200 status code and an error
		return JSON.stringify({
					id: "1", // magic number
					jsonrpc: "2.0",
					method: "lookupSoftwareApplications",
					params: {
						Username: credentials.username,
						Password: credentials.password,
						Version: "2.9.1 (441)",
						Application: "Application Loader",
						OSIdentifier: "Mac OS X 10.8.5 (x86_64)"
					}
				});
	}

	private getITMSMetadataXml(appleId: string, ipaFileName: string, ipaFileHash: string, ipaFileSize: number): string {
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
$injector.register("itmsTransporterService", ITMSTransporterService);
