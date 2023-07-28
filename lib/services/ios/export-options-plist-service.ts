import * as path from "path";
import * as mobileProvisionFinder from "ios-mobileprovision-finder";
import { IProjectData, IBuildConfig } from "../../definitions/project";
import { IFileSystem } from "../../common/declarations";
import { injector } from "../../common/yok";
import { ITempService } from "../../definitions/temp-service";
import * as constants from "../../constants";

export class ExportOptionsPlistService implements IExportOptionsPlistService {
	constructor(
		private $fs: IFileSystem,
		private $tempService: ITempService,
		private $projectData: IProjectData
	) {}

	private getExtensionProvisions() {
		const provisioningJSONPath = path.join(
			this.$projectData.getAppResourcesDirectoryPath(),
			"iOS",
			constants.NATIVE_EXTENSION_FOLDER,
			"provisioning.json"
		);
		if (!this.$fs.exists(provisioningJSONPath)) {
			return "";
		}

		interface IProvisioningJSON {
			[identifier: string]: string;
		}
		const provisioningJSON = this.$fs.readJson(
			provisioningJSONPath
		) as IProvisioningJSON;

		return Object.entries(provisioningJSON)
			.map(([id, provision]) => {
				return `<key>${id}</key>\n	<string>${provision}</string>`;
			})
			.join("\n");
	}

	public async createDevelopmentExportOptionsPlist(
		archivePath: string,
		projectData: IProjectData,
		buildConfig: IBuildConfig
	): Promise<IExportOptionsPlistOutput> {
		const exportOptionsMethod = this.getExportOptionsMethod(
			projectData,
			archivePath
		);
		const provision =
			buildConfig.provision || buildConfig.mobileProvisionIdentifier;
		const iCloudContainerEnvironment = buildConfig.iCloudContainerEnvironment;
		let plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
	<string>${exportOptionsMethod}</string>`;
		if (provision) {
			plistTemplate += `    <key>provisioningProfiles</key>
<dict>
	<key>${projectData.projectIdentifiers.ios}</key>
	<string>${provision}</string>
	${this.getExtensionProvisions()}
</dict>`;
		}
		plistTemplate += `
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>`;
		if (iCloudContainerEnvironment) {
			plistTemplate += `
    <key>iCloudContainerEnvironment</key>
    <string>${iCloudContainerEnvironment}</string>`;
		}
		plistTemplate += `
</dict>
</plist>`;

		// Save the options...
		const exportOptionsPlistFilePath = await this.$tempService.path({
			prefix: "export-",
			suffix: ".plist",
		});
		this.$fs.writeFile(exportOptionsPlistFilePath, plistTemplate);

		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		const exportFileDir = path.resolve(path.dirname(archivePath));
		const exportFilePath = path.join(
			exportFileDir,
			projectData.projectName + ".ipa"
		);

		return { exportFileDir, exportFilePath, exportOptionsPlistFilePath };
	}

	public async createDistributionExportOptionsPlist(
		archivePath: string,
		projectData: IProjectData,
		buildConfig: IBuildConfig
	): Promise<IExportOptionsPlistOutput> {
		const provision =
			buildConfig.provision || buildConfig.mobileProvisionIdentifier;
		const teamId = buildConfig.teamId;
		let plistTemplate = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
`;
		if (teamId) {
			plistTemplate += `    <key>teamID</key>
    <string>${teamId}</string>
`;
		}
		if (provision) {
			plistTemplate += `    <key>provisioningProfiles</key>
    <dict>
        <key>${projectData.projectIdentifiers.ios}</key>
        <string>${provision}</string>
        ${this.getExtensionProvisions()}
    </dict>`;
		}
		plistTemplate += `    <key>method</key>
    <string>app-store</string>
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <false/>
</dict>
</plist>`;

		// Save the options...
		const exportOptionsPlistFilePath = await this.$tempService.path({
			prefix: "export-",
			suffix: ".plist",
		});
		this.$fs.writeFile(exportOptionsPlistFilePath, plistTemplate);

		const exportFileDir = path.resolve(path.dirname(archivePath));
		const exportFilePath = path.join(
			exportFileDir,
			projectData.projectName + ".ipa"
		);

		return { exportFileDir, exportFilePath, exportOptionsPlistFilePath };
	}

	private getExportOptionsMethod(
		projectData: IProjectData,
		archivePath: string
	): string {
		const embeddedMobileProvisionPath = path.join(
			archivePath,
			"Products",
			"Applications",
			`${projectData.projectName}.app`,
			"embedded.mobileprovision"
		);
		const provision = mobileProvisionFinder.provision.readFromFile(
			embeddedMobileProvisionPath
		);

		return {
			Development: "development",
			AdHoc: "ad-hoc",
			Distribution: "app-store",
			Enterprise: "enterprise",
		}[provision.Type];
	}
}
injector.register("exportOptionsPlistService", ExportOptionsPlistService);
