import { EOL } from "os";
import { IFileSystem } from "../common/declarations";
import {
	booleanOption,
	CommandContext,
	CommandOptionsSchema,
	defineCommand,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { PlatformTypes } from "../constants";
import {
	INodePackageManager,
	IOptions,
	IPlatformCommandHelper,
} from "../declarations";
import { IPlatformsDataService } from "../definitions/platform";
import { IPluginsService } from "../definitions/plugins";
import { IProjectData, IProjectDataService } from "../definitions/project";

export const installCommandOptions = {
	frameworkPath: stringOption(),
	disableNpmInstall: booleanOption(),
	ignoreScripts: booleanOption(),
	path: stringOption(),
} satisfies CommandOptionsSchema;

export type InstallCommandContext = CommandContext<
	typeof installCommandOptions
>;

export interface IInstallCommandServices {
	$options: IOptions;
	$mobileHelper: Mobile.IMobileHelper;
	$platformsDataService: IPlatformsDataService;
	$platformCommandHelper: IPlatformCommandHelper;
	$projectData: IProjectData;
	$projectDataService: IProjectDataService;
	$pluginsService: IPluginsService;
	$logger: ILogger;
	$fs: IFileSystem;
	$packageManager: INodePackageManager;
}

export function setupInstallCommand(): IInstallCommandServices {
	const services = {
		$options: inject<IOptions>("options"),
		$mobileHelper: inject<Mobile.IMobileHelper>("mobileHelper"),
		$platformsDataService: inject<IPlatformsDataService>(
			"platformsDataService",
		),
		$platformCommandHelper: inject<IPlatformCommandHelper>(
			"platformCommandHelper",
		),
		$projectData: inject<IProjectData>("projectData"),
		$projectDataService: inject<IProjectDataService>("projectDataService"),
		$pluginsService: inject<IPluginsService>("pluginsService"),
		$logger: inject<ILogger>("logger"),
		$fs: inject<IFileSystem>("fs"),
		$packageManager: inject<INodePackageManager>("packageManager"),
	};
	services.$projectData.initializeProjectData();

	return services;
}

async function installProjectDependencies(
	context: InstallCommandContext,
	services: IInstallCommandServices,
): Promise<void> {
	let error: string = "";

	await services.$pluginsService.ensureAllDependenciesAreInstalled(
		services.$projectData,
	);

	for (const platform of services.$mobileHelper.platformNames) {
		const platformData = services.$platformsDataService.getPlatformData(
			platform,
			services.$projectData,
		);
		const frameworkPackageData = services.$projectDataService.getRuntimePackage(
			services.$projectData.projectDir,
			<PlatformTypes>platformData.platformNameLowerCase,
		);
		if (frameworkPackageData && frameworkPackageData.version) {
			try {
				const platformProjectService = platformData.platformProjectService;
				await platformProjectService.validate(
					services.$projectData,
					services.$options,
				);

				await services.$platformCommandHelper.addPlatforms(
					[`${platform}@${frameworkPackageData.version}`],
					services.$projectData,
					context.options.frameworkPath,
				);
			} catch (err) {
				error = `${error}${EOL}${err}`;
			}
		}
	}

	if (error) {
		services.$logger.error(error);
	}
}

async function installModule(
	context: InstallCommandContext,
	services: IInstallCommandServices,
	moduleName: string,
): Promise<void> {
	const projectDir = services.$projectData.projectDir;

	const devPrefix = "nativescript-dev-";
	if (!services.$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
		moduleName = devPrefix + moduleName;
	}

	await services.$packageManager.install(moduleName, projectDir, {
		"save-dev": true,
		disableNpmInstall: context.options.disableNpmInstall,
		frameworkPath: context.options.frameworkPath,
		ignoreScripts: context.options.ignoreScripts,
		path: context.options.path,
	});
}

export function runInstallCommand(
	context: InstallCommandContext,
	services: IInstallCommandServices,
): Promise<void> {
	return context.args[0]
		? installModule(context, services, context.args[0])
		: installProjectDependencies(context, services);
}

export const installCommandDefinition = defineCommand({
	name: "install",
	description:
		"Installs all platforms and dependencies described in the project, or a single plugin.",
	options: installCommandOptions,
	arguments: [{ name: "moduleName" }],
	enableHooks: false,
	setup: setupInstallCommand,
	run: runInstallCommand,
});
