import * as path from "path";
import * as mobileProvisionFinder from "ios-mobileprovision-finder";
import {
	BUILD_XCCONFIG_FILE_NAME,
	iOSAppResourcesFolderName,
	IOSNativeTargetProductTypes,
} from "../../constants";
import * as helpers from "../../common/helpers";
import { IOSProvisionService } from "../ios-provision-service";
import { IOSBuildData } from "../../data/build-data";
import {
	IProvisioningJSON,
	IXcconfigService,
	IXcprojService,
} from "../../declarations";
import { IProjectData } from "../../definitions/project";
import { IErrors, IFileSystem } from "../../common/declarations";
import * as _ from "lodash";
import { injector } from "../../common/yok";
import * as constants from "../../constants";

export class IOSSigningService implements IiOSSigningService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $iOSProvisionService: IOSProvisionService,
		private $logger: ILogger,
		private $pbxprojDomXcode: IPbxprojDomXcode,
		private $prompter: IPrompter,
		private $xcconfigService: IXcconfigService,
		private $xcprojService: IXcprojService
	) {}

	public async setupSigningForDevice(
		projectRoot: string,
		projectData: IProjectData,
		iOSBuildData: IOSBuildData
	): Promise<void> {
		const xcode = this.$pbxprojDomXcode.Xcode.open(
			this.getPbxProjPath(projectData, projectRoot)
		);
		const signing = xcode.getSigning(projectData.projectName);

		const hasProvisioningProfileInXCConfig =
			this.readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfileSpecifier(projectData) ||
			this.readXCConfigProvisioningProfileForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfile(projectData);

		if (
			hasProvisioningProfileInXCConfig &&
			(!signing || signing.style !== "Manual")
		) {
			xcode.setManualSigningStyle(projectData.projectName);
			this.getExtensionNames(projectData).forEach((name) => {
				xcode.setManualSigningStyle(name);
			});
			xcode.save();
		} else if (
			!iOSBuildData.provision &&
			!(signing && signing.style === "Manual" && !iOSBuildData.teamId)
		) {
			const teamId = await this.getDevelopmentTeam(
				projectData,
				projectRoot,
				iOSBuildData.teamId
			);
			await this.setupSigningFromTeam(projectRoot, projectData, teamId);
		}
	}

	public async setupSigningFromTeam(
		projectRoot: string,
		projectData: IProjectData,
		teamId: string
	): Promise<void> {
		const xcode = this.$pbxprojDomXcode.Xcode.open(
			this.getPbxProjPath(projectData, projectRoot)
		);
		const signing = xcode.getSigning(projectData.projectName);

		let shouldUpdateXcode = false;
		if (signing && signing.style === "Automatic") {
			if (signing.team !== teamId) {
				// Maybe the provided team is name such as "Telerik AD" and we need to convert it to CH******37
				const teamIdsForName =
					await this.$iOSProvisionService.getTeamIdsWithName(teamId);
				if (!teamIdsForName.some((id) => id === signing.team)) {
					shouldUpdateXcode = true;
				}
			}
		} else {
			shouldUpdateXcode = true;
		}

		if (shouldUpdateXcode) {
			const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(
				teamId
			);
			if (teamIdsForName.length > 0) {
				this.$logger.trace(
					`Team id ${teamIdsForName[0]} will be used for team name "${teamId}".`
				);
				teamId = teamIdsForName[0];
			}

			xcode.setAutomaticSigningStyle(projectData.projectName, teamId);
			xcode.setAutomaticSigningStyleByTargetProductTypesList(
				[
					IOSNativeTargetProductTypes.appExtension,
					IOSNativeTargetProductTypes.watchApp,
					IOSNativeTargetProductTypes.watchExtension,
				],
				teamId
			);
			this.getExtensionNames(projectData).forEach((name) => {
				xcode.setAutomaticSigningStyle(name, teamId);
			});

			xcode.save();

			this.$logger.trace(`Set Automatic signing style and team id ${teamId}.`);
		} else {
			this.$logger.trace(
				`The specified ${teamId} is already set in the Xcode.`
			);
		}
	}

	public async setupSigningFromProvision(
		projectRoot: string,
		projectData: IProjectData,
		provision?: string,
		mobileProvisionData?: mobileProvisionFinder.provision.MobileProvision
	): Promise<void> {
		if (!provision) {
			// read uuid from Xcode an cache...
			return;
		}

		const xcode = this.$pbxprojDomXcode.Xcode.open(
			this.getPbxProjPath(projectData, projectRoot)
		);
		const signing = xcode.getSigning(projectData.projectName);

		let shouldUpdateXcode = false;
		if (signing && signing.style === "Manual") {
			for (const config in signing.configurations) {
				const options = signing.configurations[config];
				if (options.name !== provision && options.uuid !== provision) {
					shouldUpdateXcode = true;
					break;
				}
			}
		} else {
			shouldUpdateXcode = true;
		}

		if (shouldUpdateXcode) {
			const projectSigningConfig = await this.getManualSigningConfiguration(
				projectData,
				provision,
				mobileProvisionData
			);
			xcode.setManualSigningStyle(
				projectData.projectName,
				projectSigningConfig
			);
			xcode.setManualSigningStyleByTargetProductTypesList(
				[
					IOSNativeTargetProductTypes.appExtension,
					IOSNativeTargetProductTypes.watchApp,
					IOSNativeTargetProductTypes.watchExtension,
				],
				projectSigningConfig
			);

			this.$logger.trace(
				`Set Manual signing style and provisioning profile: ${projectSigningConfig.name} (${projectSigningConfig.uuid})`
			);

			const extensionSigningConfig = await Promise.all(
				this.getExtensionsManualSigningConfiguration(projectData)
			);
			extensionSigningConfig.forEach(({ name, configuration }) => {
				xcode.setManualSigningStyle(name, configuration);
				this.$logger.trace(
					`Set Manual signing style and provisioning profile: ${configuration.name} (${configuration.uuid})`
				);
			});

			xcode.save();
			// this.cache(uuid);
		} else {
			this.$logger.trace(
				`The specified provisioning profile is already set in the Xcode: ${provision}`
			);
		}
	}

	private getExtensionNames(projectData: IProjectData) {
		const extensionFolderPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			constants.iOSAppResourcesFolderName,
			constants.NATIVE_EXTENSION_FOLDER
		);

		if (this.$fs.exists(extensionFolderPath)) {
			const extensionNames = this.$fs
				.readDirectory(extensionFolderPath)
				.filter((fileName) => {
					const extensionPath = path.join(extensionFolderPath, fileName);
					const stats = this.$fs.getFsStats(extensionPath);
					return stats.isDirectory() && !fileName.startsWith(".");
				});
			return extensionNames;
		}
		return [];
	}

	private getExtensionsManualSigningConfiguration(projectData: IProjectData) {
		const provisioningJSONPath = path.join(
			projectData.getAppResourcesDirectoryPath(),
			constants.iOSAppResourcesFolderName,
			constants.NATIVE_EXTENSION_FOLDER,
			constants.EXTENSION_PROVISIONING_FILENAME
		);

		if (this.$fs.exists(provisioningJSONPath)) {
			const provisioningJSON = this.$fs.readJson(
				provisioningJSONPath
			) as IProvisioningJSON;

			const extensionNames = this.getExtensionNames(projectData);

			const provisioning = Object.entries(provisioningJSON).map(
				async ([id, provision]) => {
					const name = id.split(".").at(-1);
					if (extensionNames.includes(name)) {
						const configuration = await this.getManualSigningConfiguration(
							projectData,
							provision
						);
						return { name, configuration };
					}
					return null;
				}
			);

			return provisioning;
		}

		return [];
	}

	private async getManualSigningConfiguration(
		projectData: IProjectData,
		provision: string,
		mobileProvisionData?: mobileProvisionFinder.provision.MobileProvision
	) {
		const pickStart = Date.now();
		const mobileprovision =
			mobileProvisionData ||
			(await this.$iOSProvisionService.pick(
				provision,
				projectData.projectIdentifiers.ios
			));
		const pickEnd = Date.now();
		this.$logger.trace(
			"Searched and " +
				(mobileprovision ? "found" : "failed to find ") +
				" matching provisioning profile. (" +
				(pickEnd - pickStart) +
				"ms.)"
		);
		if (!mobileprovision) {
			this.$errors.fail(
				"Failed to find mobile provision with UUID or Name: " + provision
			);
		}
		const configuration = {
			team:
				mobileprovision.TeamIdentifier &&
				mobileprovision.TeamIdentifier.length > 0
					? mobileprovision.TeamIdentifier[0]
					: undefined,
			uuid: mobileprovision.UUID,
			name: mobileprovision.Name,
			identity:
				mobileprovision.Type === "Development"
					? "iPhone Developer"
					: "iPhone Distribution",
		};
		return configuration;
	}

	private getBuildXCConfigFilePath(projectData: IProjectData): string {
		return path.join(
			projectData.appResourcesDirectoryPath,
			iOSAppResourcesFolderName,
			BUILD_XCCONFIG_FILE_NAME
		);
	}

	private getPbxProjPath(
		projectData: IProjectData,
		projectRoot: string
	): string {
		return path.join(
			this.$xcprojService.getXcodeprojPath(projectData, projectRoot),
			"project.pbxproj"
		);
	}
	private readTeamIdFromFile(projectRoot: string): string | undefined {
		try {
			const filePath = path.join(projectRoot, "teamid");
			if (this.$fs.exists(filePath)) {
				return this.$fs.readText(filePath);
			}
		} catch (e) {
			this.$logger.trace("Unable to read file: teamid. Error is: ", e);
		}
		return undefined;
	}
	private async getDevelopmentTeam(
		projectData: IProjectData,
		projectRoot: string,
		teamId?: string
	): Promise<string> {
		teamId = teamId || this.readXCConfigDevelopmentTeam(projectData);

		if (!teamId) {
			const teams = await this.$iOSProvisionService.getDevelopmentTeams();
			this.$logger.warn(
				"Xcode requires a team id to be specified when building for device."
			);
			this.$logger.warn(
				"You can specify the team id by setting the DEVELOPMENT_TEAM setting in build.xcconfig file located in App_Resources folder of your app, or by using the --teamId option when calling run, debug or livesync commands."
			);
			if (teams.length === 1) {
				teamId = teams[0].id;
				this.$logger.warn(
					"Found and using the following development team installed on your system: " +
						teams[0].name +
						" (" +
						teams[0].id +
						")"
				);
			} else if (teams.length > 0) {
				if (!helpers.isInteractive()) {
					this.$errors.fail(
						`Unable to determine default development team. Available development teams are: ${_.map(
							teams,
							(team) => team.id
						)}. Specify team in app/App_Resources/iOS/build.xcconfig file in the following way: DEVELOPMENT_TEAM = <team id>`
					);
				}
				const fromFile = this.readTeamIdFromFile(projectRoot);
				if (fromFile) {
					const idFromFile = teams.find((value) => value.id === fromFile);
					if (idFromFile) {
						teamId = idFromFile.id;
						this.$logger.info(`Team Id resolved from file: '${teamId}'.`);
					}
				}
				if (!teamId) {
					const choices: string[] = [];
					for (const team of teams) {
						choices.push(team.name + " (" + team.id + ")");
					}
					const choice = await this.$prompter.promptForChoice(
						"Found multiple development teams, select one:",
						choices
					);
					teamId = teams[choices.indexOf(choice)].id;

					const choicesPersist = [
						"Yes, set the DEVELOPMENT_TEAM setting in build.xcconfig file.",
						"Yes, persist the team id in platforms folder.",
						"No, don't persist this setting.",
					];
					const choicePersist = await this.$prompter.promptForChoice(
						"Do you want to make teamId: " +
							teamId +
							" a persistent choice for your app?",
						choicesPersist
					);
					switch (choicesPersist.indexOf(choicePersist)) {
						case 0:
							const xcconfigFile = path.join(
								projectData.appResourcesDirectoryPath,
								"iOS",
								BUILD_XCCONFIG_FILE_NAME
							);
							this.$fs.appendFile(
								xcconfigFile,
								"\nDEVELOPMENT_TEAM = " + teamId + "\n"
							);
							break;
						case 1:
							this.$fs.writeFile(path.join(projectRoot, "teamid"), teamId);
							break;
						default:
							break;
					}
				}
			}
		}

		this.$logger.trace(`Selected teamId is '${teamId}'.`);

		return teamId;
	}

	private readXCConfigDevelopmentTeam(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(
			this.getBuildXCConfigFilePath(projectData),
			"DEVELOPMENT_TEAM"
		);
	}

	private readXCConfigProvisioningProfile(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(
			this.getBuildXCConfigFilePath(projectData),
			"PROVISIONING_PROFILE"
		);
	}

	private readXCConfigProvisioningProfileForIPhoneOs(
		projectData: IProjectData
	): string {
		return this.$xcconfigService.readPropertyValue(
			this.getBuildXCConfigFilePath(projectData),
			"PROVISIONING_PROFILE[sdk=iphoneos*]"
		);
	}

	private readXCConfigProvisioningProfileSpecifier(
		projectData: IProjectData
	): string {
		return this.$xcconfigService.readPropertyValue(
			this.getBuildXCConfigFilePath(projectData),
			"PROVISIONING_PROFILE_SPECIFIER"
		);
	}

	private readXCConfigProvisioningProfileSpecifierForIPhoneOs(
		projectData: IProjectData
	): string {
		return this.$xcconfigService.readPropertyValue(
			this.getBuildXCConfigFilePath(projectData),
			"PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]"
		);
	}
}
injector.register("iOSSigningService", IOSSigningService);
