import * as path from "path";
import { IBuildArtifactsService } from "../definitions/build";
import {
	IPlatformData,
	IBuildOutputOptions,
	IValidBuildOutputData,
} from "../definitions/platform";
import { IApplicationPackage } from "../declarations";
import { IErrors, IFileSystem } from "../common/declarations";
import { injector } from "../common/yok";
import * as _ from "lodash";

export class BuildArtifactsService implements IBuildArtifactsService {
	constructor(
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $logger: ILogger
	) {}

	public async getLatestAppPackagePath(
		platformData: IPlatformData,
		buildOutputOptions: IBuildOutputOptions
	): Promise<string> {
		const outputPath =
			buildOutputOptions.outputPath ||
			platformData.getBuildOutputPath(buildOutputOptions);
		const applicationPackage = this.getLatestApplicationPackage(
			outputPath,
			platformData.getValidBuildOutputData(buildOutputOptions)
		);
		const packageFile = applicationPackage.packageName;

		if (!packageFile || !this.$fs.exists(packageFile)) {
			this.$errors.fail(
				`Unable to find built application. Try 'tns build ${platformData.platformNameLowerCase}'.`
			);
		}

		return packageFile;
	}

	public getAllAppPackages(
		buildOutputPath: string,
		validBuildOutputData: IValidBuildOutputData
	): IApplicationPackage[] {
		const rootFiles = this.$fs
			.readDirectory(buildOutputPath)
			.map((filename) => path.join(buildOutputPath, filename));
		let result = this.getApplicationPackagesCore(
			rootFiles,
			validBuildOutputData.packageNames
		);
		if (result) {
			return result;
		}

		const candidates = this.$fs.enumerateFilesInDirectorySync(buildOutputPath);
		result = this.getApplicationPackagesCore(
			candidates,
			validBuildOutputData.packageNames
		);
		if (result) {
			return result;
		}

		if (validBuildOutputData.regexes && validBuildOutputData.regexes.length) {
			const packages = candidates.filter((filepath) =>
				_.some(validBuildOutputData.regexes, (regex) =>
					regex.test(path.basename(filepath))
				)
			);
			return this.createApplicationPackages(packages);
		}

		return [];
	}

	public copyLatestAppPackage(
		targetPath: string,
		platformData: IPlatformData,
		buildOutputOptions: IBuildOutputOptions
	): void {
		targetPath = path.resolve(targetPath);

		const outputPath =
			buildOutputOptions.outputPath ||
			platformData.getBuildOutputPath(buildOutputOptions);
		const applicationPackage = this.getLatestApplicationPackage(
			outputPath,
			platformData.getValidBuildOutputData(buildOutputOptions)
		);
		const packageFile = applicationPackage.packageName;

		this.$fs.ensureDirectoryExists(path.dirname(targetPath));

		if (
			this.$fs.exists(targetPath) &&
			this.$fs.getFsStats(targetPath).isDirectory()
		) {
			const sourceFileName = path.basename(packageFile);
			this.$logger.trace(
				`Specified target path: '${targetPath}' is directory. Same filename will be used: '${sourceFileName}'.`
			);
			targetPath = path.join(targetPath, sourceFileName);
		}
		this.$fs.copyFile(packageFile, targetPath);
		this.$logger.info(`Copied file '${packageFile}' to '${targetPath}'.`);
	}

	private getLatestApplicationPackage(
		buildOutputPath: string,
		validBuildOutputData: IValidBuildOutputData
	): IApplicationPackage {
		let packages = this.getAllAppPackages(
			buildOutputPath,
			validBuildOutputData
		);
		const packageExtName = path.extname(validBuildOutputData.packageNames[0]);
		if (packages.length === 0) {
			this.$errors.fail(
				`No ${packageExtName} found in ${buildOutputPath} directory.`
			);
		}

		if (packages.length > 1) {
			this.$logger.warn(
				`More than one ${packageExtName} found in ${buildOutputPath} directory. Using the last one produced from build.`
			);
		}

		packages = _.sortBy(packages, (pkg) => pkg.time).reverse(); // We need to reverse because sortBy always sorts in ascending order

		return packages[0];
	}

	private getApplicationPackagesCore(
		candidates: string[],
		validPackageNames: string[]
	): IApplicationPackage[] {
		const packages = candidates.filter((filePath) =>
			_.includes(validPackageNames, path.basename(filePath))
		);
		if (packages.length > 0) {
			return this.createApplicationPackages(packages);
		}

		return null;
	}

	private createApplicationPackages(packages: string[]): IApplicationPackage[] {
		return packages.map((packageName) => {
			return {
				packageName,
				time: this.$fs.getFsStats(packageName).mtime,
			};
		});
	}
}
injector.register("buildArtifactsService", BuildArtifactsService);
