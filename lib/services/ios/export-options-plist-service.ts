import * as path from "path";
import * as temp from "temp";
import * as mobileProvisionFinder from "ios-mobileprovision-finder";

export class ExportOptionsPlistService implements IExportOptionsPlistService {
	constructor(private $fs: IFileSystem) { }

	public createDevelopmentExportOptionsPlist(archivePath: string, projectData: IProjectData, buildConfig: IBuildConfig): IExportOptionsPlistOutput {
		const exportOptionsMethod = this.getExportOptionsMethod(projectData, archivePath);
		const provision = buildConfig.provision || buildConfig.mobileProvisionIdentifier;
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
</dict>`;
		}
		plistTemplate += `
    <key>uploadBitcode</key>
    <false/>
    <key>compileBitcode</key>
    <false/>
</dict>
</plist>`;

		// Save the options...
		temp.track();
		const exportOptionsPlistFilePath = temp.path({ prefix: "export-", suffix: ".plist" });
		this.$fs.writeFile(exportOptionsPlistFilePath, plistTemplate);

		// The xcodebuild exportPath expects directory and writes the <project-name>.ipa at that directory.
		const exportFileDir = path.resolve(path.dirname(archivePath));
		const exportFilePath = path.join(exportFileDir, projectData.projectName + ".ipa");

		return { exportFileDir, exportFilePath, exportOptionsPlistFilePath };
	}

	public createDistributionExportOptionsPlist(projectRoot: string, projectData: IProjectData, buildConfig: IBuildConfig): IExportOptionsPlistOutput {
		const provision = buildConfig.provision || buildConfig.mobileProvisionIdentifier;
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
		temp.track();
		const exportOptionsPlistFilePath = temp.path({ prefix: "export-", suffix: ".plist" });
		this.$fs.writeFile(exportOptionsPlistFilePath, plistTemplate);

		const exportFileDir = path.resolve(path.join(projectRoot, "/build/archive"));
		const exportFilePath = path.join(exportFileDir, projectData.projectName + ".ipa");

		return { exportFileDir, exportFilePath, exportOptionsPlistFilePath };
	}

	private getExportOptionsMethod(projectData: IProjectData, archivePath: string): string {
		const embeddedMobileProvisionPath = path.join(archivePath, 'Products', 'Applications', `${projectData.projectName}.app`, "embedded.mobileprovision");
		const provision = mobileProvisionFinder.provision.readFromFile(embeddedMobileProvisionPath);

		return {
			"Development": "development",
			"AdHoc": "ad-hoc",
			"Distribution": "app-store",
			"Enterprise": "enterprise"
		}[provision.Type];
	}
}
$injector.register("exportOptionsPlistService", ExportOptionsPlistService);
