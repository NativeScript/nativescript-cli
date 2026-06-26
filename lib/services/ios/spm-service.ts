import { injector } from "../../common/yok";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import { MobileProject } from "@nstudio/trapezedev-project";
import { IPlatformData } from "../../definitions/platform";
import { IFileSystem } from "../../common/declarations";
import { ITerminalSpinnerService } from "../../definitions/terminal-spinner-service";
import { color } from "../../color";
import path = require("path");

export class SPMService implements ISPMService {
	constructor(
		private $logger: ILogger,
		private $fs: IFileSystem,
		private $projectConfigService: IProjectConfigService,
		private $terminalSpinnerService: ITerminalSpinnerService,
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

	/**
	 * Merges plugin SPM packages with app SPM packages.
	 * App packages take precedence over plugin packages with the same name.
	 * @param appPackages - Array of app SPM packages (modified in place)
	 * @param pluginPackages - Array of plugin SPM packages to merge
	 */
	private mergePluginSPMPackages(
		appPackages: IosSPMPackage[],
		pluginPackages: IosSPMPackage[],
	): void {
		// include swift packages from plugin configs
		// but allow app packages to override plugin packages with the same name
		const appPackageNames = new Set(appPackages.map((pkg) => pkg.name));

		for (const pluginPkg of pluginPackages) {
			if (appPackageNames.has(pluginPkg.name)) {
				this.$logger.trace(
					`SPM: app package overrides plugin package: ${pluginPkg.name}`,
				);
			} else {
				appPackages.push(pluginPkg);
			}
		}
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
				this.mergePluginSPMPackages(spmPackages, pluginSpmPackages);
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
			await this.resolveSPMDependencies(platformData, projectData, {
				showProgress: true,
			});
		} catch (err) {
			this.$logger.trace("SPM: error applying SPM packages: ", err);
		}
	}

	/**
	 * Resolves (downloads + pins) the Swift Package dependencies referenced by
	 * the Xcode project. On a first build this is where the NativeScript runtime
	 * (now distributed as a remote Swift package) and any other SPM packages are
	 * actually downloaded — which can take a while. Pass `showProgress` to render
	 * a live spinner so the CLI doesn't look stalled while that happens.
	 */
	public async resolveSPMDependencies(
		platformData: IPlatformData,
		projectData: IProjectData,
		options?: { showProgress?: boolean },
	) {
		const args = this.$xcodebuildArgsService
			.getXcodeProjectArgs(platformData, projectData)
			.concat([
				"-destination",
				"generic/platform=iOS",
				"-resolvePackageDependencies",
			]);

		if (!options?.showProgress) {
			await this.$xcodebuildCommandService.executeCommand(args, {
				cwd: projectData.projectDir,
				message: "Resolving SPM dependencies...",
			});
			return;
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const startedAt = Date.now();
		let activity = "Resolving Swift Package dependencies";
		let lineBuffer = "";

		const render = () => {
			const elapsed = Math.round((Date.now() - startedAt) / 1000);
			spinner.text = `${activity}… ${color.dim(`(${elapsed}s)`)}`;
		};
		// keep the elapsed timer ticking even when xcodebuild is silent (e.g.
		// while a binary artifact downloads) so the user can see it's alive.
		const ticker = setInterval(render, 1000);

		const onProgress = (chunk: { data: string; pipe: string }) => {
			lineBuffer += chunk.data;
			const lines = lineBuffer.split("\n");
			// keep the last (possibly partial) line in the buffer
			lineBuffer = lines.pop();
			for (const line of lines) {
				const described = this.describeSPMActivity(line);
				if (described) {
					activity = described;
					render();
				}
			}
		};

		render();
		spinner.start();
		try {
			await this.$xcodebuildCommandService.executeCommand(args, {
				cwd: projectData.projectDir,
				onProgress,
			});
			spinner.succeed(color.green("Swift Package dependencies resolved"));
		} catch (err) {
			spinner.fail(color.red("Failed to resolve Swift Package dependencies"));
			throw err;
		} finally {
			clearInterval(ticker);
		}
	}

	/**
	 * Best-effort pre-resolve before a build so the (potentially slow) first-time
	 * Swift package download happens under a clear progress indicator instead of
	 * silently inside the subsequent "Xcode build..." step. No-op when the
	 * project has no SPM references or they're already resolved.
	 */
	public async ensureSPMDependenciesResolved(
		platformData: IPlatformData,
		projectData: IProjectData,
	) {
		if (!this.hasSPMReferences(platformData, projectData)) {
			this.$logger.trace("SPM: project has no Swift Package references.");
			return;
		}

		if (this.arePackagesResolved(platformData, projectData)) {
			this.$logger.trace(
				"SPM: Swift Package dependencies already resolved; skipping pre-resolve.",
			);
			return;
		}

		try {
			await this.resolveSPMDependencies(platformData, projectData, {
				showProgress: true,
			});
		} catch (err) {
			// non-fatal: the build itself will resolve packages and surface the
			// authoritative error if something is genuinely wrong.
			this.$logger.trace("SPM: pre-resolve failed (continuing): ", err);
		}
	}

	/**
	 * Maps a raw xcodebuild/SwiftPM resolution log line to a concise,
	 * user-facing activity description (or null for lines we don't surface).
	 */
	private describeSPMActivity(line: string): string | null {
		const trimmed = line.trim();
		if (!trimmed) {
			return null;
		}

		// the big, otherwise-silent wait on a first build: a binary artifact
		// (the NativeScript runtime xcframework) downloading.
		if (/Downloading binary artifact/i.test(trimmed)) {
			if (/ios-spm|nativescript/i.test(trimmed)) {
				return "Downloading the NativeScript runtime (first build only)";
			}
			return "Downloading Swift Package binaries (first build only)";
		}
		if (/^Fetching\b/i.test(trimmed)) {
			return `Fetching ${this.shortenPackageRef(trimmed)}`;
		}
		if (/^Cloning\b/i.test(trimmed)) {
			return `Cloning ${this.shortenPackageRef(trimmed)}`;
		}
		if (/Computing version for/i.test(trimmed)) {
			return "Computing package versions";
		}
		if (/Resolve Package Graph/i.test(trimmed)) {
			return "Resolving Swift Package graph";
		}
		if (/Resolved source packages/i.test(trimmed)) {
			return "Finalizing Swift Package dependencies";
		}
		return null;
	}

	/** Extracts a short, readable name from a SwiftPM repo URL/log line. */
	private shortenPackageRef(line: string): string {
		const match = line.match(/https?:\/\/\S+/);
		if (!match) {
			return "Swift Packages";
		}
		return path
			.basename(match[0])
			.replace(/\.git$/, "")
			.replace(/[)\s].*$/, "");
	}

	/** True when the Xcode project references any Swift packages. */
	private hasSPMReferences(
		platformData: IPlatformData,
		projectData: IProjectData,
	): boolean {
		const pbxprojPath = path.join(
			platformData.projectRoot,
			`${projectData.projectName}.xcodeproj`,
			"project.pbxproj",
		);
		if (!this.$fs.exists(pbxprojPath)) {
			return false;
		}
		const contents = this.$fs.readText(pbxprojPath);
		return (
			contents.includes("XCRemoteSwiftPackageReference") ||
			contents.includes("XCLocalSwiftPackageReference") ||
			contents.includes("packageReferences")
		);
	}

	/**
	 * True when a Package.resolved already exists for the project — i.e. packages
	 * have been resolved at least once, so the build's own resolve step will be a
	 * fast no-op rather than a slow, silent first-time download.
	 */
	private arePackagesResolved(
		platformData: IPlatformData,
		projectData: IProjectData,
	): boolean {
		const candidates = [
			path.join(
				platformData.projectRoot,
				`${projectData.projectName}.xcworkspace`,
				"xcshareddata",
				"swiftpm",
				"Package.resolved",
			),
			path.join(
				platformData.projectRoot,
				`${projectData.projectName}.xcodeproj`,
				"project.xcworkspace",
				"xcshareddata",
				"swiftpm",
				"Package.resolved",
			),
		];
		return candidates.some((p) => this.$fs.exists(p));
	}
}
injector.register("spmService", SPMService);
