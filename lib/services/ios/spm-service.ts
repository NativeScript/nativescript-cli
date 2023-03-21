import { injector } from "../../common/yok";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import {
	MobileProject,
	IosSPMPackageDefinition,
} from "@rigor789/trapezedev-project";
import { IPlatformData } from "../../definitions/platform";

export class SPMService implements ISPMService {
	constructor(
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService,
		private $xcodebuildCommandService: IXcodebuildCommandService,
		private $xcodebuildArgsService: IXcodebuildArgsService
	) {}

	public getSPMPackages(projectData: IProjectData): IosSPMPackageDefinition[] {
		const spmPackages = this.$projectConfigService.getValue(
			"ios.experimentalSPMPackages",
			[]
		);

		return spmPackages;
	}

	public hasSPMPackages(projectData: IProjectData): boolean {
		return this.getSPMPackages(projectData).length > 0;
	}

	public async applySPMPackages(
		platformData: IPlatformData,
		projectData: IProjectData
	) {
		try {
			const spmPackages = this.getSPMPackages(projectData);

			if (!spmPackages.length) {
				this.$logger.trace("SPM: no SPM packages to apply.");
				return;
			}

			const project = new MobileProject(platformData.projectRoot, {
				ios: {
					path: ".",
				},
				enableAndroid: false,
			});
			await project.load();

			if (!project.ios) {
				this.$logger.trace("SPM: no iOS project found via trapeze.");
				return;
			}

			// todo: handle removing packages? Or just warn and require a clean?
			for (const pkg of spmPackages) {
				this.$logger.trace(`SPM: adding package ${pkg.name} to project.`, pkg);
				await project.ios.addSPMPackage(projectData.projectName, pkg);
			}
			await project.commit();

			// finally resolve the dependencies
			await this.resolveSPMDependencies(platformData, projectData);
		} catch (err) {
			this.$logger.trace("SPM: error applying SPM packages: ", err);
		}
	}

	public async resolveSPMDependencies(
		platformData: IPlatformData,
		projectData: IProjectData
	) {
		await this.$xcodebuildCommandService.executeCommand(
			this.$xcodebuildArgsService
				.getXcodeProjectArgs(platformData.projectRoot, projectData)
				.concat([
					"-destination",
					"generic/platform=iOS",
					"-resolvePackageDependencies",
				]),
			{
				cwd: projectData.projectDir,
				message: "Resolving SPM dependencies...",
			}
		);
	}
}
injector.register("spmService", SPMService);
