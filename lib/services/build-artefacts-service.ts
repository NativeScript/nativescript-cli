import * as path from "path";

export class BuildArtefactsService implements IBuildArtefactsService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger
	) { }

	public async getLastBuiltPackagePath(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): Promise<string> {
		const packageFile = buildConfig.buildForDevice ?
			this.getLatestApplicationPackageForDevice(platformData, buildConfig, outputPath).packageName :
			this.getLatestApplicationPackageForEmulator(platformData, buildConfig, outputPath).packageName;

		if (!packageFile || !this.$fs.exists(packageFile)) {
			this.$errors.failWithoutHelp(`Unable to find built application. Try 'tns build ${platformData.platformNameLowerCase}'.`);
		}

		return packageFile;
	}

	private getLatestApplicationPackageForDevice(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		outputPath = outputPath || platformData.getBuildOutputPath(buildConfig);
		const buildOutputOptions = { buildForDevice: true, release: buildConfig.release, androidBundle: buildConfig.androidBundle };
		return this.getLatestApplicationPackage(outputPath, platformData.getValidBuildOutputData(buildOutputOptions));
	}

	private getLatestApplicationPackageForEmulator(platformData: IPlatformData, buildConfig: IBuildConfig, outputPath?: string): IApplicationPackage {
		outputPath = outputPath || platformData.getBuildOutputPath(buildConfig);
		const buildOutputOptions = { buildForDevice: false, release: buildConfig.release, androidBundle: buildConfig.androidBundle };
		return this.getLatestApplicationPackage(outputPath, platformData.getValidBuildOutputData(buildOutputOptions));
	}

	private getLatestApplicationPackage(buildOutputPath: string, validBuildOutputData: IValidBuildOutputData): IApplicationPackage {
		let packages = this.getApplicationPackages(buildOutputPath, validBuildOutputData);
		const packageExtName = path.extname(validBuildOutputData.packageNames[0]);
		if (packages.length === 0) {
			this.$errors.fail(`No ${packageExtName} found in ${buildOutputPath} directory.`);
		}

		if (packages.length > 1) {
			this.$logger.warn(`More than one ${packageExtName} found in ${buildOutputPath} directory. Using the last one produced from build.`);
		}

		packages = _.sortBy(packages, pkg => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

		return packages[0];
	}

	private getApplicationPackages(buildOutputPath: string, validBuildOutputData: IValidBuildOutputData): IApplicationPackage[] {
		// Get latest package` that is produced from build
		let result = this.getApplicationPackagesCore(this.$fs.readDirectory(buildOutputPath).map(filename => path.join(buildOutputPath, filename)), validBuildOutputData.packageNames);
		if (result) {
			return result;
		}

		const candidates = this.$fs.enumerateFilesInDirectorySync(buildOutputPath);
		result = this.getApplicationPackagesCore(candidates, validBuildOutputData.packageNames);
		if (result) {
			return result;
		}

		if (validBuildOutputData.regexes && validBuildOutputData.regexes.length) {
			return this.createApplicationPackages(candidates.filter(filepath => _.some(validBuildOutputData.regexes, regex => regex.test(path.basename(filepath)))));
		}

		return [];
	}

	private getApplicationPackagesCore(candidates: string[], validPackageNames: string[]): IApplicationPackage[] {
		const packages = candidates.filter(filePath => _.includes(validPackageNames, path.basename(filePath)));
		if (packages.length > 0) {
			return this.createApplicationPackages(packages);
		}

		return null;
	}

	private createApplicationPackages(packages: string[]): IApplicationPackage[] {
		return packages.map(filepath => this.createApplicationPackage(filepath));
	}

	private createApplicationPackage(packageName: string): IApplicationPackage {
		return {
			packageName,
			time: this.$fs.getFsStats(packageName).mtime
		};
	}
}
$injector.register("buildArtefactsService", BuildArtefactsService);
