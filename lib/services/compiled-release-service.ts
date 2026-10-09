import * as path from "path";
import { resolvePackagePath } from "@rigor789/resolve-package-path";
import { COMPILER_PACKAGE_NAME } from "../constants";
import { IChildProcess, IErrors, IFileSystem } from "../common/declarations";
import { IPlatformData } from "../definitions/platform";
import { IProjectData, IProjectDataService } from "../definitions/project";
import {
	IAndroidBuildData,
	IBuildData,
	IiOSBuildData,
} from "../definitions/build";
import { IGradleCommandService } from "../definitions/gradle";
import { IOSProvisionService } from "./ios-provision-service";
import { injector } from "../common/yok";

export interface ICompiledReleaseOptions {
	projectDir: string;
	platform: string;
	release?: boolean;
	compiled?: boolean;
}

/**
 * A release build compiled by `@nativescript/compiler` into Swift or
 * Kotlin: no JavaScript runtime, no webpack bundle and no `platforms/<platform>`
 * runtime project. Prepare writes the native project to
 * `platforms/compiled/<platform>`; build compiles it there and returns the
 * .app, .ipa, .apk or .aab for the deploy services to install.
 */
export class CompiledReleaseService {
	constructor(
		private $childProcess: IChildProcess,
		private $errors: IErrors,
		private $exportOptionsPlistService: IExportOptionsPlistService,
		private $fs: IFileSystem,
		private $gradleCommandService: IGradleCommandService,
		private $iOSProvisionService: IOSProvisionService,
		private $logger: ILogger,
		private $mobileHelper: Mobile.IMobileHelper,
		private $projectDataService: IProjectDataService,
		private $xcodebuildCommandService: IXcodebuildCommandService,
	) {}

	/**
	 * `--compiled` (or `--no-compiled`) wins; otherwise `release.compiled` in
	 * nativescript.config, where `ios.release.compiled` and
	 * `android.release.compiled` override the top-level value. Debug builds
	 * always run on the JavaScript runtime.
	 */
	public isCompiledRelease(options: ICompiledReleaseOptions): boolean {
		if (!options.release) {
			return false;
		}

		if (typeof options.compiled === "boolean") {
			return options.compiled;
		}

		const nsConfig = this.$projectDataService.getProjectData(
			options.projectDir,
		).nsConfig;
		const platformConfig: { release?: { compiled?: boolean } } =
			nsConfig?.[options.platform.toLowerCase() as "ios" | "android"];

		return !!(
			platformConfig?.release?.compiled ?? nsConfig?.release?.compiled
		);
	}

	private getProjectRoot(projectData: IProjectData, platform: string): string {
		return path.join(
			projectData.platformsDir,
			"compiled",
			platform.toLowerCase(),
		);
	}

	public async prepare(
		platformData: IPlatformData,
		projectData: IProjectData,
	): Promise<void> {
		const platform = platformData.platformNameLowerCase;
		if (
			!this.$mobileHelper.isiOSPlatform(platform) &&
			!this.$mobileHelper.isAndroidPlatform(platform)
		) {
			this.$errors.fail(
				`A compiled release build is available for iOS and Android, not ${platformData.normalizedPlatformName}.`,
			);
		}

		const args = [
			this.getCompilerPath(projectData),
			projectData.projectDir,
			"--platform",
			platform,
			"--out",
			this.getProjectRoot(projectData, platform),
			"--name",
			projectData.projectName,
			"--bundle",
			projectData.projectIdentifiers[platform],
		];

		this.$logger.info(`Compiling the app to native code (${platform})...`);
		try {
			await this.$childProcess.spawnFromEvent(process.execPath, args, "close", {
				cwd: projectData.projectDir,
				stdio: "inherit",
			});
		} catch (err) {
			this.$errors.fail(`The compile to native code failed. ${err.message}`);
		}
	}

	public async build(
		platformData: IPlatformData,
		projectData: IProjectData,
		buildData: IBuildData,
	): Promise<string> {
		if (buildData.clean) {
			const projectRoot = this.getProjectRoot(
				projectData,
				platformData.platformNameLowerCase,
			);
			this.$fs.deleteDirectory(path.join(projectRoot, "DerivedData"));
			this.$fs.deleteDirectory(path.join(projectRoot, "build"));
		}

		const packageFile = this.$mobileHelper.isAndroidPlatform(
			platformData.platformNameLowerCase,
		)
			? await this.buildAndroid(projectData, <IAndroidBuildData>buildData)
			: await this.buildIOS(projectData, <IiOSBuildData>buildData);
		if (!this.$fs.exists(packageFile)) {
			this.$errors.fail(
				`The compiled release build finished without producing ${packageFile}.`,
			);
		}

		return packageFile;
	}

	private getCompilerPath(projectData: IProjectData): string {
		return this.getCompilerBin(projectData, "ns-native");
	}

	/** A command of the project's `@nativescript/compiler` (`ns-native`, `ns-compiled-verify`), as a script for Node. */
	public getCompilerBin(projectData: IProjectData, name: string): string {
		const packageDir = this.getPackageDir(projectData);
		const { bin } = this.$fs.readJson(path.join(packageDir, "package.json"));
		if (!bin?.[name]) {
			this.$errors.fail(
				`The project's ${COMPILER_PACKAGE_NAME} has no ${name}: update it.`,
			);
		}

		return path.join(packageDir, bin[name]);
	}

	private getPackageDir(projectData: IProjectData): string {
		const packageDir = resolvePackagePath(COMPILER_PACKAGE_NAME, {
			paths: [projectData.projectDir],
		});
		if (!packageDir) {
			this.$errors.fail(
				`A compiled release build needs ${COMPILER_PACKAGE_NAME} in the project. ` +
					`Install it with 'npm install --save-dev ${COMPILER_PACKAGE_NAME}', ` +
					`or build on the JavaScript runtime with --no-compiled.`,
			);
		}

		return packageDir;
	}

	private async buildIOS(
		projectData: IProjectData,
		buildData: IiOSBuildData,
	): Promise<string> {
		const projectRoot = this.getProjectRoot(projectData, "ios");
		const name = projectData.projectName;

		// The compiler generates the Xcode project (and integrates CocoaPods) and names
		// the project or workspace to build; a compiler that does not is run through XcodeGen here.
		const integrated = path.join(projectRoot, "ns-native-project.json");
		const generated: { workspace?: string; project?: string } | null = this.$fs.exists(integrated)
			? this.$fs.readJson(integrated)
			: null;
		const workspace = generated?.workspace ?? null;
		if (!generated) {
			try {
				await this.$childProcess.spawnFromEvent(
					"xcodegen",
					["generate", "--quiet"],
					"close",
					{ cwd: projectRoot, stdio: "inherit" },
				);
			} catch (err) {
				this.$errors.fail(
					err.code === "ENOENT"
						? "The native iOS build generates its Xcode project with XcodeGen. Install it with 'brew install xcodegen'."
						: err.message,
				);
			}
		}

		const projectArgs = [
			...(workspace
				? ["-workspace", workspace]
				: ["-project", generated?.project ?? `${name}.xcodeproj`]),
			"-scheme",
			name,
			"-configuration",
			"Release",
			"-derivedDataPath",
			"DerivedData",
			"-quiet",
		];

		if (!buildData.buildForDevice && !buildData.buildForAppStore) {
			await this.$xcodebuildCommandService.executeCommand(
				[
					...projectArgs,
					"-destination",
					"generic/platform=iOS Simulator",
					"build",
				],
				{ cwd: projectRoot, message: "Xcode build (compiled release)..." },
			);

			return path.join(
				projectRoot,
				"DerivedData",
				"Build",
				"Products",
				"Release-iphonesimulator",
				`${name}.app`,
			);
		}

		const outputDir = path.join(projectRoot, "build");
		const archivePath = path.join(outputDir, `${name}.xcarchive`);
		// Signing settings given to xcodebuild reach every target, and the kit's
		// Swift package rejects a provisioning profile, so with --provision the
		// archive stays unsigned and the export signs the app with the profile.
		// The generated project leaves device builds signable (for Xcode), so an
		// archive without a team says it is unsigned here.
		const automaticSigning =
			buildData.teamId && !buildData.provision
				? [
						"CODE_SIGNING_ALLOWED=YES",
						"CODE_SIGN_STYLE=Automatic",
						`DEVELOPMENT_TEAM=${buildData.teamId}`,
						"-allowProvisioningUpdates",
					]
				: ["CODE_SIGNING_ALLOWED=NO"];
		this.$fs.deleteDirectory(archivePath);
		await this.$xcodebuildCommandService.executeCommand(
			[
				...projectArgs,
				"-destination",
				"generic/platform=iOS",
				"-archivePath",
				archivePath,
				"archive",
				...automaticSigning,
			],
			{ cwd: projectRoot, message: "Xcode archive (compiled release)..." },
		);

		if (!buildData.teamId && !buildData.provision) {
			this.$logger.warn(
				`The archive is unsigned: pass --team-id <team> or --provision <profile> to sign it and export an .ipa that installs on a device. ` +
					`The unsigned .ipa is for re-signing elsewhere.`,
			);
			return this.packageUnsignedIpa(archivePath, outputDir, name);
		}

		const exportOptions = buildData.provision
			? await this.createProvisionExportOptions(
					projectData,
					buildData.provision,
					outputDir,
				)
			: buildData.buildForAppStore
				? await this.$exportOptionsPlistService.createDistributionExportOptionsPlist(
						archivePath,
						projectData,
						<any>buildData,
					)
				: await this.$exportOptionsPlistService.createDevelopmentExportOptionsPlist(
						archivePath,
						projectData,
						<any>buildData,
					);
		await this.$xcodebuildCommandService.executeCommand(
			[
				"-exportArchive",
				"-archivePath",
				archivePath,
				"-exportPath",
				exportOptions.exportFileDir,
				"-exportOptionsPlist",
				exportOptions.exportOptionsPlistFilePath,
				...(buildData.provision ? [] : ["-allowProvisioningUpdates"]),
			],
			{ cwd: projectRoot, message: "Exporting the .ipa..." },
		);

		return exportOptions.exportFilePath;
	}

	private async createProvisionExportOptions(
		projectData: IProjectData,
		provision: string,
		outputDir: string,
	): Promise<IExportOptionsPlistOutput> {
		const bundleId = projectData.projectIdentifiers.ios;
		const profile = await this.$iOSProvisionService.pick(provision, bundleId);
		if (!profile) {
			this.$errors.fail(
				`Failed to find mobile provision with UUID or Name: ${provision}`,
			);
		}

		const method = {
			Development: "development",
			AdHoc: "ad-hoc",
			Distribution: "app-store",
			Enterprise: "enterprise",
		}[profile.Type];
		const exportOptionsPlistFilePath = path.join(
			outputDir,
			"ExportOptions.plist",
		);
		this.$fs.writeFile(
			exportOptionsPlistFilePath,
			`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>${method}</string>
	<key>signingStyle</key>
	<string>manual</string>
	<key>teamID</key>
	<string>${profile.TeamIdentifier[0]}</string>
	<key>provisioningProfiles</key>
	<dict>
		<key>${bundleId}</key>
		<string>${profile.UUID}</string>
	</dict>
</dict>
</plist>
`,
		);

		return {
			exportFileDir: outputDir,
			exportFilePath: path.join(outputDir, `${projectData.projectName}.ipa`),
			exportOptionsPlistFilePath,
		};
	}

	private async packageUnsignedIpa(
		archivePath: string,
		outputDir: string,
		name: string,
	): Promise<string> {
		const payloadDir = path.join(outputDir, "Payload");
		const ipaPath = path.join(outputDir, `${name}.ipa`);
		this.$fs.deleteDirectory(payloadDir);
		this.$fs.deleteFile(ipaPath);
		this.$fs.ensureDirectoryExists(payloadDir);
		await this.$childProcess.spawnFromEvent(
			"cp",
			[
				"-R",
				path.join(archivePath, "Products", "Applications", `${name}.app`),
				payloadDir,
			],
			"close",
		);
		await this.$childProcess.spawnFromEvent(
			"zip",
			["-qr", "-y", ipaPath, "Payload"],
			"close",
			{ cwd: outputDir },
		);
		this.$fs.deleteDirectory(payloadDir);

		return ipaPath;
	}

	private async buildAndroid(
		projectData: IProjectData,
		buildData: IAndroidBuildData,
	): Promise<string> {
		const projectRoot = this.getProjectRoot(projectData, "android");
		const args = [
			"-p",
			projectRoot,
			buildData.androidBundle ? ":bundleRelease" : ":assembleRelease",
			"--quiet",
		];

		// AGP's injected signing replaces the generated project's debug signing
		// for this build only, as Android Studio's "Generate Signed Bundle" does.
		if (buildData.keyStorePath) {
			args.push(
				`-Pandroid.injected.signing.store.file=${path.resolve(buildData.keyStorePath)}`,
				`-Pandroid.injected.signing.store.password=${buildData.keyStorePassword}`,
				`-Pandroid.injected.signing.key.alias=${buildData.keyStoreAlias}`,
				`-Pandroid.injected.signing.key.password=${buildData.keyStoreAliasPassword}`,
			);
		}

		await this.$gradleCommandService.executeCommand(args, {
			cwd: projectRoot,
			message: "Gradle build (compiled release)...",
			gradlePath:
				buildData.gradlePath ??
				path.join(this.getPackageDir(projectData), "kit-android", "gradlew"),
		});

		// The generated project is the app module itself, so AGP names its
		// outputs after the root project, which the compiler names --name.
		const outputName = projectData.projectName;
		return buildData.androidBundle
			? path.join(
					projectRoot,
					"build",
					"outputs",
					"bundle",
					"release",
					`${outputName}-release.aab`,
				)
			: path.join(
					projectRoot,
					"build",
					"outputs",
					"apk",
					"release",
					`${outputName}-release.apk`,
				);
	}
}
injector.register("compiledReleaseService", CompiledReleaseService);
