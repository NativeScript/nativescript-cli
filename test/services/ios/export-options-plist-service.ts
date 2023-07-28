import { Yok } from "../../../lib/common/yok";
import { ExportOptionsPlistService } from "../../../lib/services/ios/export-options-plist-service";
import { assert } from "chai";
import * as _ from "lodash";
import { TempServiceStub, ProjectDataStub } from "../../stubs";

let actualPlistTemplate: string = null;
const projectName = "myProjectName";
const projectRoot = "/my/test/project/platforms/ios";
const archivePath = "/my/test/archive/path";

let provisioningJSON: Record<string, any> | undefined;

function createTestInjector() {
	const injector = new Yok();
	provisioningJSON = undefined;
	injector.register("fs", {
		exists(path: string) {
			return path.endsWith("provisioning.json");
		},
		writeFile: (exportPath: string, plistTemplate: string) => {
			actualPlistTemplate = plistTemplate;
		},
		readJson() {
			return provisioningJSON ?? {};
		},
	});
	injector.register("exportOptionsPlistService", ExportOptionsPlistService);
	injector.register("tempService", TempServiceStub);
	const projectData = new ProjectDataStub();
	projectData.initializeProjectData(projectRoot);
	projectData.projectName = projectName;

	injector.register("projectData", projectData);

	return injector;
}

function expectPlistTemplateToContain(template: string, expected: string) {
	const trimmedTemplate = template.replace(/\s/g, "");
	const trimmedExpected = expected.replace(/\s/g, "");
	assert.isTrue(
		trimmedTemplate.indexOf(trimmedExpected) !== -1,
		`Expected plist template to contain:\n\n${expected}\n\nbut it was:\n\n${template}`
	);
}

describe("ExportOptionsPlistService", () => {
	describe("createDevelopmentExportOptionsPlist", () => {
		const testCases = [
			{
				name: "should create default export options plist",
				buildConfig: {},
			},
			{
				name: "should create export options plist with provision",
				buildConfig: { provision: "myTestProvision" },
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string></dict>",
			},
			{
				name: "should create export options plist with mobileProvisionIdentifier",
				buildConfig: { mobileProvisionIdentifier: "myTestProvision" },
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string></dict>",
			},
			{
				name: "should create export options plist with Production iCloudContainerEnvironment",
				buildConfig: { iCloudContainerEnvironment: "Production" },
				expectedPlist:
					"<key>iCloudContainerEnvironment</key><string>Production</string>",
			},
			{
				name: "should add extension provisioning profiles if there are any",
				buildConfig: { provision: "myTestProvision" },
				provisioningJSON: {
					"org.nativescript.myTestApp.SampleExtension":
						"mySampleExtensionTestProvision",
				},
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string><key>org.nativescript.myTestApp.SampleExtension</key><string>mySampleExtensionTestProvision</string></dict>",
			},
		];

		_.each(testCases, (testCase) => {
			_.each(
				["Development", "AdHoc", "Distribution", "Enterprise"],
				(provisionType) => {
					it(testCase.name, async () => {
						const injector = createTestInjector();
						if (testCase.provisioningJSON) {
							provisioningJSON = testCase.provisioningJSON;
						}
						const exportOptionsPlistService = injector.resolve(
							"exportOptionsPlistService"
						);
						exportOptionsPlistService.getExportOptionsMethod = () =>
							provisionType;

						const projectData = {
							projectName,
							projectIdentifiers: { ios: "org.nativescript.myTestApp" },
						};
						await exportOptionsPlistService.createDevelopmentExportOptionsPlist(
							archivePath,
							projectData,
							testCase.buildConfig
						);

						expectPlistTemplateToContain(
							actualPlistTemplate,
							`<key>method</key><string>${provisionType}</string>`
						);
						expectPlistTemplateToContain(
							actualPlistTemplate,
							`<key>uploadBitcode</key><false/>`
						);
						expectPlistTemplateToContain(
							actualPlistTemplate,
							`<key>compileBitcode</key><false/>`
						);
						if (testCase.expectedPlist) {
							expectPlistTemplateToContain(
								actualPlistTemplate,
								testCase.expectedPlist
							);
						}
					});
				}
			);
		});
	});
	describe("createDistributionExportOptionsPlist", () => {
		const testCases = [
			{
				name: "should create default export options plist",
				buildConfig: {},
			},
			{
				name: "should create export options plist with provision",
				buildConfig: { provision: "myTestProvision" },
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string></dict>",
			},
			{
				name: "should create export options plist with mobileProvisionIdentifier",
				buildConfig: { mobileProvisionIdentifier: "myTestProvision" },
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string></dict>",
			},
			{
				name: "should create export options plist with teamID",
				buildConfig: { teamId: "myTeamId" },
				expectedPlist: "<key>teamID</key><string>myTeamId</string>",
			},
			{
				name: "should add extension provisioning profiles if there are any",
				buildConfig: { provision: "myTestProvision" },
				provisioningJSON: {
					"org.nativescript.myTestApp.SampleExtension":
						"mySampleExtensionTestProvision",
				},
				expectedPlist:
					"<key>provisioningProfiles</key><dict><key>org.nativescript.myTestApp</key><string>myTestProvision</string><key>org.nativescript.myTestApp.SampleExtension</key><string>mySampleExtensionTestProvision</string></dict>",
			},
		];

		_.each(testCases, (testCase) => {
			it(testCase.name, async () => {
				const injector = createTestInjector();
				if (testCase.provisioningJSON) {
					provisioningJSON = testCase.provisioningJSON;
				}
				const exportOptionsPlistService = injector.resolve(
					"exportOptionsPlistService"
				);
				exportOptionsPlistService.getExportOptionsMethod = () => "app-store";

				const projectData = {
					projectName,
					projectIdentifiers: { ios: "org.nativescript.myTestApp" },
				};
				await exportOptionsPlistService.createDistributionExportOptionsPlist(
					projectRoot,
					projectData,
					testCase.buildConfig
				);

				expectPlistTemplateToContain(
					actualPlistTemplate,
					`<key>method</key><string>app-store</string>`
				);
				expectPlistTemplateToContain(
					actualPlistTemplate,
					`<key>uploadBitcode</key><false/>`
				);
				expectPlistTemplateToContain(
					actualPlistTemplate,
					`<key>compileBitcode</key><false/>`
				);
				expectPlistTemplateToContain(
					actualPlistTemplate,
					`<key>uploadSymbols</key><false/>`
				);

				if (testCase.expectedPlist) {
					expectPlistTemplateToContain(
						actualPlistTemplate,
						testCase.expectedPlist
					);
				}
			});
		});
	});
});
