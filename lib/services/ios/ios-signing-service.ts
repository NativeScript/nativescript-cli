import * as path from "path";
import * as mobileProvisionFinder from "ios-mobileprovision-finder";
import { BUILD_XCCONFIG_FILE_NAME, iOSAppResourcesFolderName } from "../../constants";
import * as helpers from "../../common/helpers";
import { IOSProvisionService } from "../ios-provision-service";

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
	) { }

	public async setupSigningForDevice(projectRoot: string, projectData: IProjectData, buildConfig: IiOSBuildConfig): Promise<void> {
		const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData, projectRoot));
		const signing = xcode.getSigning(projectData.projectName);

		const hasProvisioningProfileInXCConfig =
			this.readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfileSpecifier(projectData) ||
			this.readXCConfigProvisioningProfileForIPhoneOs(projectData) ||
			this.readXCConfigProvisioningProfile(projectData);

		if (hasProvisioningProfileInXCConfig && (!signing || signing.style !== "Manual")) {
			xcode.setManualSigningStyle(projectData.projectName);
			xcode.save();
		} else if (!buildConfig.provision && !(signing && signing.style === "Manual" && !buildConfig.teamId)) {
			const teamId = await this.getDevelopmentTeam(projectData, projectRoot, buildConfig.teamId);
			await this.setupSigningFromTeam(projectRoot, projectData, teamId);
		}
	}

	public async setupSigningFromTeam(projectRoot: string, projectData: IProjectData, teamId: string): Promise<void> {
		const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData, projectRoot));
		const signing = xcode.getSigning(projectData.projectName);

		let shouldUpdateXcode = false;
		if (signing && signing.style === "Automatic") {
			if (signing.team !== teamId) {
				// Maybe the provided team is name such as "Telerik AD" and we need to convert it to CH******37
				const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
				if (!teamIdsForName.some(id => id === signing.team)) {
					shouldUpdateXcode = true;
				}
			}
		} else {
			shouldUpdateXcode = true;
		}

		if (shouldUpdateXcode) {
			const teamIdsForName = await this.$iOSProvisionService.getTeamIdsWithName(teamId);
			if (teamIdsForName.length > 0) {
				this.$logger.trace(`Team id ${teamIdsForName[0]} will be used for team name "${teamId}".`);
				teamId = teamIdsForName[0];
			}

			xcode.setAutomaticSigningStyle(projectData.projectName, teamId);
			xcode.setAutomaticSigningStyleByTargetProductType("com.apple.product-type.app-extension", teamId);
			xcode.save();

			this.$logger.trace(`Set Automatic signing style and team id ${teamId}.`);
		} else {
			this.$logger.trace(`The specified ${teamId} is already set in the Xcode.`);
		}
	}

	public async setupSigningFromProvision(projectRoot: string, projectData: IProjectData, provision?: string, mobileProvisionData?: mobileProvisionFinder.provision.MobileProvision): Promise<void> {
		if (!provision) {
			// read uuid from Xcode an cache...
			return;
		}

		const xcode = this.$pbxprojDomXcode.Xcode.open(this.getPbxProjPath(projectData, projectRoot));
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
			const pickStart = Date.now();
			const mobileprovision = mobileProvisionData || await this.$iOSProvisionService.pick(provision, projectData.projectIdentifiers.ios);
			const pickEnd = Date.now();
			this.$logger.trace("Searched and " + (mobileprovision ? "found" : "failed to find ") + " matching provisioning profile. (" + (pickEnd - pickStart) + "ms.)");
			if (!mobileprovision) {
				this.$errors.failWithoutHelp("Failed to find mobile provision with UUID or Name: " + provision);
			}
			const configuration = {
				team: mobileprovision.TeamIdentifier && mobileprovision.TeamIdentifier.length > 0 ? mobileprovision.TeamIdentifier[0] : undefined,
				uuid: mobileprovision.UUID,
				name: mobileprovision.Name,
				identity: mobileprovision.Type === "Development" ? "iPhone Developer" : "iPhone Distribution"
			};
			xcode.setManualSigningStyle(projectData.projectName, configuration);
			xcode.setManualSigningStyleByTargetProductType("com.apple.product-type.app-extension", configuration);
			xcode.save();

			// this.cache(uuid);
			this.$logger.trace(`Set Manual signing style and provisioning profile: ${mobileprovision.Name} (${mobileprovision.UUID})`);
		} else {
			this.$logger.trace(`The specified provisioning profile is already set in the Xcode: ${provision}`);
		}
	}

	private getBuildXCConfigFilePath(projectData: IProjectData): string {
		return path.join(projectData.appResourcesDirectoryPath, iOSAppResourcesFolderName, BUILD_XCCONFIG_FILE_NAME);
	}

	private getPbxProjPath(projectData: IProjectData, projectRoot: string): string {
		return path.join(this.$xcprojService.getXcodeprojPath(projectData, projectRoot), "project.pbxproj");
	}

	private async getDevelopmentTeam(projectData: IProjectData, projectRoot: string, teamId?: string): Promise<string> {
		teamId = teamId || this.readXCConfigDevelopmentTeam(projectData);

		if (!teamId) {
			const teams = await this.$iOSProvisionService.getDevelopmentTeams();
			this.$logger.warn("Xcode requires a team id to be specified when building for device.");
			this.$logger.warn("You can specify the team id by setting the DEVELOPMENT_TEAM setting in build.xcconfig file located in App_Resources folder of your app, or by using the --teamId option when calling run, debug or livesync commands.");
			if (teams.length === 1) {
				teamId = teams[0].id;
				this.$logger.warn("Found and using the following development team installed on your system: " + teams[0].name + " (" + teams[0].id + ")");
			} else if (teams.length > 0) {
				if (!helpers.isInteractive()) {
					this.$errors.failWithoutHelp(`Unable to determine default development team. Available development teams are: ${_.map(teams, team => team.id)}. Specify team in app/App_Resources/iOS/build.xcconfig file in the following way: DEVELOPMENT_TEAM = <team id>`);
				}

				const choices: string[] = [];
				for (const team of teams) {
					choices.push(team.name + " (" + team.id + ")");
				}
				const choice = await this.$prompter.promptForChoice('Found multiple development teams, select one:', choices);
				teamId = teams[choices.indexOf(choice)].id;

				const choicesPersist = [
					"Yes, set the DEVELOPMENT_TEAM setting in build.xcconfig file.",
					"Yes, persist the team id in platforms folder.",
					"No, don't persist this setting."
				];
				const choicePersist = await this.$prompter.promptForChoice("Do you want to make teamId: " + teamId + " a persistent choice for your app?", choicesPersist);
				switch (choicesPersist.indexOf(choicePersist)) {
					case 0:
						const xcconfigFile = path.join(projectData.appResourcesDirectoryPath, "iOS", BUILD_XCCONFIG_FILE_NAME);
						this.$fs.appendFile(xcconfigFile, "\nDEVELOPMENT_TEAM = " + teamId + "\n");
						break;
					case 1:
						this.$fs.writeFile(path.join(projectRoot, "teamid"), teamId);
						break;
					default:
						break;
				}
			}
		}

		this.$logger.trace(`Selected teamId is '${teamId}'.`);

		return teamId;
	}

	private readXCConfigDevelopmentTeam(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "DEVELOPMENT_TEAM");
	}

	private readXCConfigProvisioningProfile(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE");
	}

	private readXCConfigProvisioningProfileForIPhoneOs(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE[sdk=iphoneos*]");
	}

	private readXCConfigProvisioningProfileSpecifier(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER");
	}

	private readXCConfigProvisioningProfileSpecifierForIPhoneOs(projectData: IProjectData): string {
		return this.$xcconfigService.readPropertyValue(this.getBuildXCConfigFilePath(projectData), "PROVISIONING_PROFILE_SPECIFIER[sdk=iphoneos*]");
	}
}
$injector.register("iOSSigningService", IOSSigningService);