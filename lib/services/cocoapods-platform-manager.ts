import { EOL } from "os";
import * as path from "path";
import * as semver from "semver";
import { PODFILE_NAME } from "../constants";
import { IProjectData, ICocoaPodsPlatformManager, IPodfilePlatformData } from "../definitions/project";

export class CocoaPodsPlatformManager implements ICocoaPodsPlatformManager {
	constructor(private $logger: ILogger) { }

	public addPlatformSection(projectData: IProjectData, podfilePlatformData: IPodfilePlatformData, projectPodfileContent: string): string {
		const platformSectionData = this.getPlatformSectionData(projectPodfileContent);
		if (platformSectionData && platformSectionData.podfilePlatformData) {
			const shouldReplacePlatformSection = this.shouldReplacePlatformSection(projectData, platformSectionData.podfilePlatformData, podfilePlatformData);
			if (shouldReplacePlatformSection) {
				this.$logger.warn(`Multiple identical platforms with different versions have been detected during the processing of podfiles. The current platform's content "${platformSectionData.podfilePlatformData.content}" from ${platformSectionData.podfilePlatformData.path} will be replaced with "${podfilePlatformData.content}" from ${podfilePlatformData.path}`);
				const newSection = this.buildPlatformSection(podfilePlatformData);
				projectPodfileContent = projectPodfileContent.replace(platformSectionData.platformSectionContent, newSection.trim());
			}
		} else {
			projectPodfileContent = projectPodfileContent.trim() + EOL + EOL + this.buildPlatformSection(podfilePlatformData);
		}

		return projectPodfileContent;
	}

	public removePlatformSection(moduleName: string, projectPodfileContent: string, podfilePath: string): string {
		const platformSectionData = this.getPlatformSectionData(projectPodfileContent);
		if (platformSectionData && platformSectionData.podfilePlatformData && platformSectionData.podfilePlatformData.path === podfilePath) {
			const podfileContentRegExp = new RegExp(`# Begin Podfile - ([\\s\\S]*?)# End Podfile`, "mg");
			const allPodfiles = projectPodfileContent.match(podfileContentRegExp) || [];
			const selectedPlatformData = this.selectPlatformDataFromProjectPodfile(allPodfiles);
			const newPlatformSection = selectedPlatformData ? this.buildPlatformSection(selectedPlatformData) : "";
			const regExp = new RegExp(`${platformSectionData.platformSectionContent}\\r?\\n`, "mg");
			projectPodfileContent = projectPodfileContent.replace(regExp, newPlatformSection);
		}

		return projectPodfileContent;
	}

	public replacePlatformRow(podfileContent: string, podfilePath: string): { replacedContent: string, podfilePlatformData: IPodfilePlatformData } {
		let podfilePlatformData: IPodfilePlatformData = null;
		const platformRowRegExp = new RegExp(`^\\s*?(platform\\b\\s*?\\:\\s*?ios\\b(?:,\\s*?['"](.+)['"])?)`, "gm");
		const replacedContent = podfileContent.replace(platformRowRegExp, (substring: string, firstGroup: string, secondGroup: string) => {
			podfilePlatformData = { content: firstGroup, version: secondGroup, path: podfilePath };
			return `# ${substring.trim()}`;
		});

		return { replacedContent, podfilePlatformData };
	}

	private getPlatformSectionData(projectPodfileContent: string): { podfilePlatformData: IPodfilePlatformData, platformSectionContent: string } {
		const platformSectionRegExp = new RegExp(`${this.getPlatformSectionHeader()} ([\\s\\S]*?)with[\\s\\S]*?\\n([\\s\\S]*?(?:,\\s*?['"](.+)['"])?)\\n${this.getPlatformSectionFooter()}`, "m");
		const match = platformSectionRegExp.exec(projectPodfileContent);
		let result = null;
		if (match && match[0]) {
			result = {
				platformSectionContent: match[0],
				podfilePlatformData: {
					path: match[1].trim(),
					content: match[2],
					version: match[3]
				}
			};
		}

		return result;
	}

	private selectPlatformDataFromProjectPodfile(allPodfiles: string[]): IPodfilePlatformData {
		const platformRowRegExp = new RegExp(`^\\s*?#\\s*?(platform\\b\\s*?\\:\\s*?ios\\b(?:,\\s*?['"](.+)['"])?)`, "m");
		const podfilePathRegExp = new RegExp(`# Begin Podfile - ([\\s\\S]*?)${EOL}`);
		let selectedPlatformData: IPodfilePlatformData = null;
		_.each(allPodfiles, podfileContent => {
			const platformMatch = platformRowRegExp.exec(podfileContent);
			const podfilePathMatch: any[] = podfilePathRegExp.exec(podfileContent) || [];
			// platform without version -> select it with highest priority
			if (platformMatch && platformMatch[0] && !platformMatch[2]) {
				selectedPlatformData = {
					version: null,
					content: platformMatch[1],
					path: podfilePathMatch[1]
				};
				return false;
			}

			// platform with version
			if (platformMatch && platformMatch[0] && platformMatch[2]) {
				if (!selectedPlatformData || semver.gt(semver.coerce(platformMatch[2]), semver.coerce(selectedPlatformData.version))) {
					selectedPlatformData = {
						version: platformMatch[2],
						content: platformMatch[1],
						path: podfilePathMatch[1]
					};
				}
			}
		});

		return selectedPlatformData;
	}

	private shouldReplacePlatformSection(projectData: IProjectData, oldPodfilePlatformData: IPodfilePlatformData, currentPodfilePlatformData: IPodfilePlatformData): boolean {
		// The selected platform should be replaced in the following cases:
		// 1. When the pod file is from App_Resources and the selected platform is not from App_Resources
		// 2. When the pod file is from App_Resources, the selected platform is also from App_Resources
		// and the pod's version is greater than the selected one
		// 3. When the pod file doesn't have platform's version -> `platform :ios`
		// 4. When the pod file has a version greater than the selected platform's version
		const appResourcesPodfilePath = path.join(projectData.getAppResourcesDirectoryPath(), "iOS", PODFILE_NAME);
		const isFromAppResources = oldPodfilePlatformData.path !== appResourcesPodfilePath && currentPodfilePlatformData.path === appResourcesPodfilePath;
		const isFromAppResourcesWithGreaterPlatformVersion = oldPodfilePlatformData.path === appResourcesPodfilePath && currentPodfilePlatformData.path === appResourcesPodfilePath && semver.gt(semver.coerce(currentPodfilePlatformData.version), semver.coerce(oldPodfilePlatformData.version));
		const isPodfileWithGreaterPlatformVersion = !currentPodfilePlatformData.version || (oldPodfilePlatformData.version && semver.gt(semver.coerce(currentPodfilePlatformData.version), semver.coerce(oldPodfilePlatformData.version)));
		const result = isFromAppResources || isFromAppResourcesWithGreaterPlatformVersion || isPodfileWithGreaterPlatformVersion;
		return result;
	}

	private buildPlatformSection(podfilePlatformData: IPodfilePlatformData) {
		let result = `${this.getPlatformSectionHeader()} ${podfilePlatformData.path} with`;
		if (podfilePlatformData.version) {
			result += ` ${podfilePlatformData.version}`;
		}

		result += `${EOL}${podfilePlatformData.content}${EOL}${this.getPlatformSectionFooter()}${EOL}`;
		return result;
	}

	private getPlatformSectionHeader(): string {
		return '# NativeScriptPlatformSection';
	}

	private getPlatformSectionFooter(): string {
		return '# End NativeScriptPlatformSection';
	}
}
$injector.register("cocoaPodsPlatformManager", CocoaPodsPlatformManager);
