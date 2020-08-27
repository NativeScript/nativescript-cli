import { Yok } from "../../../lib/common/yok";
import { IOSSigningService } from "../../../lib/services/ios/ios-signing-service";
import { assert } from "chai";
import * as _ from "lodash";
import { ManualSigning } from "pbxproj-dom/xcode";
import { Errors } from "../../../lib/common/errors";
import { IInjector } from "../../../lib/common/definitions/yok";

interface IXcodeMock {
	isSetManualSigningStyleCalled: boolean;
	isSetAutomaticSigningStyleCalled: boolean;
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

	constructor(private data: { signing: { style: string; team?: string } }) {}

	public getSigning() {
		return this.data.signing;
	}

	public setManualSigningStyle(
		projectName: string,
		configuration: ManualSigning
	) {
		this.isSetManualSigningStyleCalled = true;
	}

	public setAutomaticSigningStyle() {
		this.isSetAutomaticSigningStyleCalled = true;
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

function setup(data: {
	hasXCConfigrovisioning?: boolean;
	hasXCConfigDevelopmentTeam?: boolean;
	signing?: { style: string };
	teamIdsForName?: string[];
	provision?: string;
}): { injector: IInjector; xcodeMock: any } {
	const {
		hasXCConfigrovisioning,
		hasXCConfigDevelopmentTeam,
		signing,
		teamIdsForName,
		provision = "myProvision",
	} = data;
	const xcodeMock = new XcodeMock({ signing });

	const injector = new Yok();
	injector.register("errors", Errors);
	injector.register("fs", {});
	injector.register("iOSProvisionService", {
		getTeamIdsWithName: () => teamIdsForName || [],
		pick: async (uuidOrName: string, projId: string) => {
			return (<any>{
				NativeScriptDev,
				NativeScriptDist,
				NativeScriptAdHoc,
			})[uuidOrName];
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

describe("IOSSigningService", () => {
	describe("setupSigningForDevice", () => {
		const testCases = [
			{
				name:
					"should sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is still not signed",
				arrangeData: { hasXCConfigrovisioning: true, signing: null },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name:
					"should sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is automatically signed",
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
				name:
					"shouldn't sign the project manually when PROVISIONING_PROFILE is provided from xcconfig and the project is already manually signed",
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
				name:
					"should sign the project automatically when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is still not signed",
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
				name:
					"should sign the project automatically when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is automatically signed",
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
				name:
					"shouldn't sign the project when PROVISIONING_PROFILE is not provided from xcconfig, DEVELOPMENT_TEAM is provided from xcconfig and the project is already manually signed",
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
		const testCases = [
			{
				name:
					"should sign the project for given teamId when the project is still not signed",
				arrangeData: <any>{ signing: null },
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
				name:
					"should sign the project for given teamId when the project is already automatically signed for another team",
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
				name:
					"shouldn't sign the project for given teamId when the project is already automatically signed for this team",
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
				name:
					"shouldn't sign the project for given teamName when the project is already automatically signed for this team",
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
				name:
					"should set automatic signing style when the project is already manually signed",
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
		];

		_.each(testCases, (testCase) => {
			it(testCase.name, async () => {
				const { injector, xcodeMock } = setup(testCase.arrangeData);

				const iOSSigningService: IiOSSigningService = injector.resolve(
					"iOSSigningService"
				);
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
		const testCases = [
			{
				name: "should sign the project manually when it is still not signed",
				arrangeData: <any>{ signing: null },
				assert: (xcodeMock: IXcodeMock) => {
					assert.isTrue(xcodeMock.isSetManualSigningStyleCalled);
					assert.isTrue(
						xcodeMock.isSetManualSigningStyleByTargetProductTypesListCalled
					);
					assert.isTrue(xcodeMock.isSaveCalled);
				},
			},
			{
				name:
					"should sign the project manually when it is automatically signed",
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
		];

		_.each(testCases, (testCase) => {
			_.each(
				["NativeScriptDev", "NativeScriptDist", "NativeScriptAdHoc"],
				(provision) => {
					it(`${testCase.name} for ${provision} provision`, async () => {
						const { injector, xcodeMock } = setup(testCase.arrangeData);

						const iOSSigningService: IiOSSigningService = injector.resolve(
							"iOSSigningService"
						);
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

			const iOSSigningService: IiOSSigningService = injector.resolve(
				"iOSSigningService"
			);
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
