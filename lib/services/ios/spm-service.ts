import { injector } from "../../common/yok";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import { MobileProject } from "@nstudio/trapezedev-project";
import { IPlatformData } from "../../definitions/platform";
import path = require("path");

export class SPMService implements ISPMService {
	constructor(
		private $logger: ILogger,
		private $projectConfigService: IProjectConfigService,
		private $xcodebuildCommandService: IXcodebuildCommandService,
		private $xcodebuildArgsService: IXcodebuildArgsService,
	) {}

	public getSPMPackages(
		projectData: IProjectData,
		platform: string,
	): IosSPMPackage[] {
		const spmPackages = this.$projectConfigService.getValue(
			`${platform}.SPMPackages`,
			[],
		);

		return spmPackages;
	}

	// note: this is not used anywhere at the moment.
	// public hasSPMPackages(projectData: IProjectData): boolean {
	// 	return this.getSPMPackages(projectData).length > 0;
	// }

	public async applySPMPackages(
		platformData: IPlatformData,
		projectData: IProjectData,
		pluginSpmPackages?: IosSPMPackage[],
	) {
		try {
			const spmPackages = this.getSPMPackages(
				projectData,
				platformData.platformNameLowerCase,
			);

			if (pluginSpmPackages?.length) {
				// include swift packages from plugin configs
				spmPackages.push(...pluginSpmPackages);
			}

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

			// note: in trapeze both visionOS and iOS are handled by the ios project.
			if (!project.ios) {
				this.$logger.trace("SPM: no iOS project found via trapeze.");
				return;
			}

			// todo: handle removing packages? Or just warn and require a clean?
			for (const pkg of spmPackages) {
				if ("path" in pkg) {
					// resolve the path relative to the project root
					this.$logger.trace("SPM: resolving path for package: ", pkg.path);
					pkg.path = path.resolve(projectData.projectDir, pkg.path);
				}
				this.$logger.trace(`SPM: adding package ${pkg.name} to project.`, pkg);
				await project.ios.addSPMPackage(projectData.projectName, pkg);

				// Add to other Targets if specified (like widgets, etc.)
				if (pkg.targets?.length) {
					for (const target of pkg.targets) {
						await project.ios.addSPMPackage(target, pkg);
					}
				}
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
		projectData: IProjectData,
	) {
		await this.$xcodebuildCommandService.executeCommand(
			this.$xcodebuildArgsService
				.getXcodeProjectArgs(platformData, projectData)
				.concat([
					"-destination",
					"generic/platform=iOS",
					"-resolvePackageDependencies",
				]),
			{
				cwd: projectData.projectDir,
				message: "Resolving SPM dependencies...",
			},
		);
	}
}
injector.register("spmService", SPMService);
