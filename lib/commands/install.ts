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

const installCommandOptions = {
	frameworkPath: stringOption(),
	disableNpmInstall: booleanOption(),
	ignoreScripts: booleanOption(),
	path: stringOption(),
} satisfies CommandOptionsSchema;

async function installProjectDependencies(
	context: CommandContext<typeof installCommandOptions>,
): Promise<void> {
	const $options = context.injector.get<IOptions>("options");
	const $mobileHelper =
		context.injector.get<Mobile.IMobileHelper>("mobileHelper");
	const $platformsDataService = context.injector.get<IPlatformsDataService>(
		"platformsDataService",
	);
	const $platformCommandHelper = context.injector.get<IPlatformCommandHelper>(
		"platformCommandHelper",
	);
	const $projectData = context.injector.get<IProjectData>("projectData");
	const $projectDataService =
		context.injector.get<IProjectDataService>("projectDataService");
	const $pluginsService =
		context.injector.get<IPluginsService>("pluginsService");
	const $logger = context.injector.get<ILogger>("logger");

	let error: string = "";

	await $pluginsService.ensureAllDependenciesAreInstalled($projectData);

	for (const platform of $mobileHelper.platformNames) {
		const platformData = $platformsDataService.getPlatformData(
			platform,
			$projectData,
		);
		const frameworkPackageData = $projectDataService.getRuntimePackage(
			$projectData.projectDir,
			<PlatformTypes>platformData.platformNameLowerCase,
		);
		if (frameworkPackageData && frameworkPackageData.version) {
			try {
				const platformProjectService = platformData.platformProjectService;
				await platformProjectService.validate($projectData, $options);

				await $platformCommandHelper.addPlatforms(
					[`${platform}@${frameworkPackageData.version}`],
					$projectData,
					context.options.frameworkPath,
				);
			} catch (err) {
				error = `${error}${EOL}${err}`;
			}
		}
	}

	if (error) {
		$logger.error(error);
	}
}

async function installModule(
	context: CommandContext<typeof installCommandOptions>,
	moduleName: string,
): Promise<void> {
	const $projectData = context.injector.get<IProjectData>("projectData");
	const $fs = context.injector.get<IFileSystem>("fs");
	const $packageManager =
		context.injector.get<INodePackageManager>("packageManager");

	const projectDir = $projectData.projectDir;

	const devPrefix = "nativescript-dev-";
	if (!$fs.exists(moduleName) && moduleName.indexOf(devPrefix) !== 0) {
		moduleName = devPrefix + moduleName;
	}

	await $packageManager.install(moduleName, projectDir, {
		"save-dev": true,
		disableNpmInstall: context.options.disableNpmInstall,
		frameworkPath: context.options.frameworkPath,
		ignoreScripts: context.options.ignoreScripts,
		path: context.options.path,
	});
}

export const installCommandDefinition = defineCommand({
	name: "install",
	description:
		"Installs all platforms and dependencies described in the project, or a single plugin.",
	options: installCommandOptions,
	arguments: [{ name: "moduleName" }],
	enableHooks: false,
	// In setup, not run: it lands ahead of the arguments policy, so being
	// outside a project is what a bad invocation reports first.
	setup(): void {
		inject<IProjectData>("projectData").initializeProjectData();
	},
	run(context): Promise<void> {
		return context.args[0]
			? installModule(context, context.args[0])
			: installProjectDependencies(context);
	},
});
