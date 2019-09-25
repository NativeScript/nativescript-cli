import { Yok } from "../../../lib/common/yok";
import { ExportOptionsPlistService } from "../../../lib/services/ios/export-options-plist-service";
import { assert } from "chai";
import { EOL } from "os";

let actualPlistTemplate: string = null;
const projectName = "myProjectName";
const projectRoot = "/my/test/project/platforms/ios";
const archivePath = "/my/test/archive/path";

function createTestInjector() {
	const injector = new Yok();
	injector.register("fs", {
		writeFile: (exportPath: string, plistTemplate: string) => {
			actualPlistTemplate = plistTemplate;
		}
	});
	injector.register("exportOptionsPlistService", ExportOptionsPlistService);

	return injector;
}

describe("ExportOptionsPlistService", () => {
	describe("createDevelopmentExportOptionsPlist", () => {
		const testCases = [
			{
				name: "should create default export options plist",
				buildConfig: {}
			},
			{
				name: "should create export options plist with provision",
				buildConfig: { provision: "myTestProvision" },
				expectedPlist: "<key>provisioningProfiles</key> <dict> 	<key>org.nativescript.myTestApp</key> 	<string>myTestProvision</string> </dict>"
			},
			{
				name: "should create export options plist with mobileProvisionIdentifier",
				buildConfig: { mobileProvisionIdentifier: "myTestProvision" },
				expectedPlist: "<key>provisioningProfiles</key> <dict> 	<key>org.nativescript.myTestApp</key> 	<string>myTestProvision</string> </dict>"
			},
			{
				name: "should create export options plist with Production iCloudContainerEnvironment",
				buildConfig: { iCloudContainerEnvironment: "Production" },
				expectedPlist: "<key>iCloudContainerEnvironment</key>     <string>Production</string>"
			}
		];

		_.each(testCases, testCase => {
			_.each(["Development", "AdHoc", "Distribution", "Enterprise"], provisionType => {
				it(testCase.name, () => {
					const injector = createTestInjector();
					const exportOptionsPlistService = injector.resolve("exportOptionsPlistService");
					exportOptionsPlistService.getExportOptionsMethod = () => provisionType;

					const projectData = { projectName, projectIdentifiers: { ios: "org.nativescript.myTestApp" }};
					exportOptionsPlistService.createDevelopmentExportOptionsPlist(archivePath, projectData, testCase.buildConfig);

					const template = actualPlistTemplate.split(EOL).join(" ");
					assert.isTrue(template.indexOf(`<key>method</key> 	<string>${provisionType}</string>`) > 0);
					assert.isTrue(template.indexOf("<key>uploadBitcode</key>     <false/>") > 0);
					assert.isTrue(template.indexOf("<key>compileBitcode</key>     <false/>") > 0);
					if (testCase.expectedPlist) {
						assert.isTrue(template.indexOf(testCase.expectedPlist) > 0);
					}
				});
			});
		});
	});
	describe("createDistributionExportOptionsPlist", () => {
		const testCases = [
			{
				name: "should create default export options plist",
				buildConfig: {}
			},
			{
				name: "should create export options plist with provision",
				buildConfig: { provision: "myTestProvision" },
				expectedPlist: "<key>provisioningProfiles</key>     <dict>         <key>org.nativescript.myTestApp</key>         <string>myTestProvision</string>     </dict>"
			},
			{
				name: "should create export options plist with mobileProvisionIdentifier",
				buildConfig: { mobileProvisionIdentifier: "myTestProvision" },
				expectedPlist: "<key>provisioningProfiles</key>     <dict>         <key>org.nativescript.myTestApp</key>         <string>myTestProvision</string>     </dict>"
			},
			{
				name: "should create export options plist with teamID",
				buildConfig: { teamId: "myTeamId" },
				expectedPlist: "<key>teamID</key>     <string>myTeamId</string>"
			}
		];

		_.each(testCases, testCase => {
			it(testCase.name, () => {
				const injector = createTestInjector();
				const exportOptionsPlistService = injector.resolve("exportOptionsPlistService");
				exportOptionsPlistService.getExportOptionsMethod = () => "app-store";

				const projectData = { projectName, projectIdentifiers: { ios: "org.nativescript.myTestApp" }};
				exportOptionsPlistService.createDistributionExportOptionsPlist(projectRoot, projectData, testCase.buildConfig);

				const template = actualPlistTemplate.split(EOL).join(" ");
				assert.isTrue(template.indexOf("<key>method</key>     <string>app-store</string>") > 0);
				assert.isTrue(template.indexOf("<key>uploadBitcode</key>     <false/>") > 0);
				assert.isTrue(template.indexOf("<key>compileBitcode</key>     <false/>") > 0);
				assert.isTrue(template.indexOf("<key>uploadSymbols</key>     <false/>") > 0);
				if (testCase.expectedPlist) {
					assert.isTrue(template.indexOf(testCase.expectedPlist) > 0);
				}
			});
		});
	});
});
