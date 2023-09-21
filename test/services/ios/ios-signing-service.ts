import { Yok } from "../../../lib/common/yok";
import { IOSSigningService } from "../../../lib/services/ios/ios-signing-service";
import { assert } from "chai";
import * as _ from "lodash";
import { ManualSigning } from "pbxproj-dom/xcode";
import { Errors } from "../../../lib/common/errors";
import { IInjector } from "../../../lib/common/definitions/yok";

interface IXcodeMock {
	isSetManualSigningStyleCalled: boolean;
	isSetManualSigningStyleCalledFor(projectName: string): boolean;
	isSetAutomaticSigningStyleCalled: boolean;
	isSetAutomaticSigningStyleCalledFor(projectName: string): boolean;
	isSetManualSigningStyleByTargetProductTypesListCalled: boolean;
	isSetAutomaticSigningStyleByTargetProductTypesListCalled: boolean;
	isSaveCalled: boolean;
}

const projectRoot = "myProjectRoot";
const teamId = "myTeamId";
const projectData: any = {
	projectName: "myProjectName",
	appResourcesDirectoryPath: "app-resources/path",
	projectIdentifiers: {
		ios: "org.nativescript.testApp",
	},
	getAppResourcesDirectoryPath: () => "app-resources/path",
};
const NativeScriptDev = {
	Name: "NativeScriptDev",
	TeamName: "Telerik AD",
	TeamIdentifier: ["TKID101"],
	Entitlements: {
		"application-identifier": "*",
		"com.apple.developer.team-identifier": "ABC",
	},
	UUID: "12345",
	ProvisionsAllDevices: false,
	Type: "Development",
};
const NativeScriptDist = {
	Name: "NativeScriptDist",
	TeamName: "Telerik AD",
	TeamIdentifier: ["TKID202"],
	Entitlements: {
		"application-identifier": "*",
		"com.apple.developer.team-identifier": "ABC",
	},
	UUID: "6789",
	ProvisionsAllDevices: true,
	Type: "Distribution",
};
const NativeScriptAdHoc = {
	Name: "NativeScriptAdHoc",
	TeamName: "Telerik AD",
	TeamIdentifier: ["TKID303"],
	Entitlements: {
		"application-identifier": "*",
		"com.apple.developer.team-identifier": "ABC",
	},
	UUID: "1010",
	ProvisionsAllDevices: true,
	Type: "Distribution",
};

class XcodeMock implements IXcodeMock {
	public isSetManualSigningStyleCalled = false;
	public isSetAutomaticSigningStyleCalled = false;
	public isSetManualSigningStyleByTargetProductTypesListCalled = false;
	public isSetAutomaticSigningStyleByTargetProductTypesListCalled = false;
	public isSaveCalled = false;

	private manualSigningStyles: Record<string, ManualSigning> = {};
	public isSetManualSigningStyleCalledFor(projectName: string) {
		return (
			this.isSetManualSigningStyleCalled &&
			projectName in this.manualSigningStyles
		);
	}

	private automaticSigningStyles: Record<string, string> = {};
	public isSetAutomaticSigningStyleCalledFor(projectName: string) {
		return (
			this.isSetAutomaticSigningStyleCalled &&
			projectName in this.automaticSigningStyles
		);
	}

	constructor(private data: { signing: { style: string; team?: string } }) {}

	public getSigning() {
		return this.data.signing;
	}

	public setManualSigningStyle(
		projectName: string,
		configuration: ManualSigning
	) {
		this.isSetManualSigningStyleCalled = true;
		this.manualSigningStyles[projectName] = configuration;
	}

	public setAutomaticSigningStyle(projectName: string, teamId: string) {
		this.isSetAutomaticSigningStyleCalled = true;
		this.automaticSigningStyles[projectName] = teamId;
	}

	public setManualSigningStyleByTargetProductTypesList() {
		this.isSetManualSigningStyleByTargetProductTypesListCalled = true;
	}

	public setAutomaticSigningStyleByTargetProductTypesList() {
		this.isSetAutomaticSigningStyleByTargetProductTypesListCalled = true;
	}

	public save() {
		this.isSaveCalled = true;
	}
}

interface SetupData {
	hasXCConfigrovisioning?: boolean;
	hasXCConfigDevelopmentTeam?: boolean;
	signing?: { style: string; team?: string };
	teamIdsForName?: string[];
	provision?: string;
	provisioningJSON?: Record<string, string>;
	extensions?: string[];
}

function setup(data: SetupData): { injector: IInjector; xcodeMock: any } {
	const {
		hasXCConfigrovisioning,
		hasXCConfigDevelopmentTeam,
		signing,
		teamIdsForName,
		provision = "myProvision",
		provisioningJSON,
		extensions,
	} = data;
	const xcodeMock = new XcodeMock({ signing });

	const injector = new Yok();
	injector.register("errors", Errors);

	// provisioningJSON = undefined;
	injector.register("fs", {
		exists(path: string) {
			if (path.endsWith("provisioning.json")) {
				return !!provisioningJSON;
			}
			if (path.endsWith("extensions")) {
				return !!extensions?.length;
			}
			return false;
		},
		readDirectory(path: string): string[] {
			if (path.endsWith("extensions")) {
				return extensions ?? [];
			}
			return [];
		},
		readJson() {
			return provisioningJSON ?? {};
		},
		getFsStats(path: string) {
			if (path.includes("extensions") && extensions?.length) {
				return {
					isDirectory: () => true,
				};
			}
			return { isDirectory: () => false };
		},
	});
	injector.register("iOSProvisionService", {
		getTeamIdsWithName: () => teamIdsForName || [],
		pick: async (uuidOrName: string, projId: string) => {
			return {
				NativeScriptDev,
				NativeScriptDist,
				NativeScriptAdHoc,
			}[uuidOrName];
		},
	});
	injector.register("logger", {
		trace: () => ({}),
	});
	injector.register("pbxprojDomXcode", {
		Xcode: {
			open: () => xcodeMock,
		},
	});
	injector.register("prompter", {});
	injector.register("xcconfigService", {
		readPropertyValue: (xcconfigFilePath: string, propertyName: string) => {
			if (propertyName.startsWith("PROVISIONING_PROFILE")) {
				return hasXCConfigrovisioning ? provision : null;
			}
			if (propertyName.startsWith("DEVELOPMENT_TEAM")) {
				return hasXCConfigDevelopmentTeam ? teamId : null;
			}
		},
	});
	injector.register("xcprojService", {
		getXcodeprojPath: () => "some/path",
	});
	injector.register("iOSSigningService", IOSSigningService);

	return { injector, xcodeMock };
}

type TestCase = {
	name: string;
	arrangeData: SetupData;
	assert: (xcodeMock: IXcodeMock) => void;
};

describe("IOSSigningService", () => {
	describe("setupSigningForDevice", () => {
		const testCases: TestCase[] = [
			{
				name: "should sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is still not signed",
				arrangeData: { hasXCConfigrovisioning: true, signing: null },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is automatically signed",
				arrangeData: {
					hasXCConfigrovisioning: true,
					signing: { style: "Automatic" },
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "shouldn't sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is already manually signed",
				arrangeData: {
					hasXCConfigrovisioning: true,
					signing: { style: "Manual" },
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
					assert.isFalse(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign the project automatically when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is still not signed",
				arrangeData: {
					hasXCConfigrovisioning: false,
					hasXCConfigDevelopmentTeam: true,
					signing: null,
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign the project automatically when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is automatically signed",
				arrangeData: {
					hasXCConfigrovisioning: false,
					hasXCConfigDevelopmentTeam: true,
					signing: { style: "Automatic" },
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "shouldn't sign the project when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is already manually signed",
				arrangeData: {
					hasXCConfigrovisioning: false,
					hasXCConfigDevelopmentTeam: true,
					signing: { style: "Manual" },
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isFalse(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isFalse(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
					assert.isFalse(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign extensions",
				arrangeData: {
					hasXCConfigrovisioning: true,
					signing: null as any,
					extensions: ["testExtension"],
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(
						xcodeMock.isSetManualSigningStyleCalledFor("testExtension")
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
		];

		_.each(testCases, (testCase) => {
			it(testCase.name, async () => {
				const { injector, xcodeMock } = setup(testCase.arrangeData);

				const iOSSigningService = injector.resolve("iOSSigningService");
				await iOSSigningService.setupSigningForDevice(
					projectRoot,
					projectData,
					(<any>testCase).buildConfig || {}
				);

				testCase.assert(xcodeMock);
			});
		});
	});
	describe("setupSigningFromTeam", () => {
		const testCases: TestCase[] = [
			{
				name: "should sign the project for given teamId when the project is still not signed",
				arrangeData: { signing: null },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
				},
			},
			{
				name: "should sign the project for given teamId when the project is already automatically signed for another team",
				arrangeData: { signing: { style: "Automatic" } },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
				},
			},
			{
				name: "shouldn't sign the project for given teamId when the project is already automatically signed for this team",
				arrangeData: { signing: { style: "Automatic", team: teamId } },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isFalse(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isFalse(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isFalse(xcodeMock.isSaveCalled);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
				},
			},
			{
				name: "shouldn't sign the project for given teamName when the project is already automatically signed for this team",
				arrangeData: {
					signing: { style: "Automatic", team: "anotherTeamId" },
					teamIdsForName: ["anotherTeamId"],
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isFalse(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isFalse(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isFalse(xcodeMock.isSaveCalled);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
				},
			},
			{
				name: "should set automatic signing style when the project is already manually signed",
				arrangeData: { signing: { style: "Manual" } },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetAutomaticSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
				},
			},
			{
				name: "should sign extensions",
				arrangeData: {
					signing: null,
					extensions: ["testExtension"],
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(
						xcodeMock.isSetAutomaticSigningStyleCalledFor("testExtension")
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
		];

		_.each(testCases, (testCase) => {
			it(testCase.name, async () => {
				const { injector, xcodeMock } = setup(testCase.arrangeData);

				const iOSSigningService: IiOSSigningService =
					injector.resolve("iOSSigningService");
				await iOSSigningService.setupSigningFromTeam(
					projectRoot,
					projectData,
					teamId
				);

				testCase.assert(xcodeMock);
			});
		});
	});
	describe("setupSigningFromProvision", () => {
		const testCases: TestCase[] = [
			{
				name: "should sign the project manually when it is still not signed",
				arrangeData: { signing: null },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetManualSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign the project manually when it is automatically signed",
				arrangeData: { signing: { style: "Automatic" } },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetManualSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "shouldn't sign the project when it is already manual signed",
				arrangeData: { signing: { style: "Manual" } },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isFalse(xcodeMock.isSetManualSigningStyleCalled);
					assert.isFalse(
						xcodeMock.isSetManualSigningStyleByTargetProductTypesListCalled
					);
					assert.isFalse(xcodeMock.isSaveCalled);
				},
			},
			{
				name: "should sign extensions",
				arrangeData: {
					signing: null,
					extensions: ["testExtension"],
					provisioningJSON: {
						testExtension: "<provision>",
					},
				},
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(
						xcodeMock.isSetManualSigningStyleCalledFor("testExtension")
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
		];

		_.each(testCases, (testCase) => {
			_.each(
				["NativeScriptDev", "NativeScriptDist", "NativeScriptAdHoc"],
				(provision) => {
					it(`${testCase.name} for ${provision} provision`, async () => {
						// Replace <provision> with the actual provision being tested.
						if (testCase.arrangeData.provisioningJSON) {
							Object.entries(testCase.arrangeData.provisioningJSON).forEach(
								([id, provision_]) => {
									if (provision_ === "<provision>") {
										testCase.arrangeData.provisioningJSON[id] = provision;
									}
								}
							);
						}
						const { injector, xcodeMock } = setup(testCase.arrangeData);

						const iOSSigningService: IiOSSigningService =
							injector.resolve("iOSSigningService");
						await iOSSigningService.setupSigningFromProvision(
							projectRoot,
							projectData,
							provision
						);

						testCase.assert(xcodeMock);
					});
				}
			);
		});

		it("should throw an error when no mobileProvisionData", async () => {
			const provision = "myTestProvision";
			const { injector } = setup({ signing: null });

			const iOSSigningService: IiOSSigningService =
				injector.resolve("iOSSigningService");
			assert.isRejected(
				iOSSigningService.setupSigningFromProvision(
					projectRoot,
					projectData,
					provision
				),
				`Failed to find mobile provision with UUID or Name: ${provision}`
			);
		});
	});
});
