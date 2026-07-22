import { injector } from "../../common/yok";
import { IProjectConfigService, IProjectData } from "../../definitions/project";
import { MobileProject } from "@nstudio/trapezedev-project";
import { IPlatformData } from "../../definitions/platform";
import { IFileSystem } from "../../common/declarations";
import { ITerminalSpinnerService } from "../../definitions/terminal-spinner-service";
import { color } from "../../color";
import path = require("path");
import os = require("os");
import fs = require("fs");

export class SPMService implements ISPMService {
	// SwiftPM keeps one bare clone per source package here (shared by Xcode and
	// xcodebuild). Watching a package's clone grow is the only visibility into
	// an otherwise silent long fetch — SwiftPM clones a repository's ENTIRE git
	// history to read Package.swift, so a package hosted in a multi-GB repo can
	// legitimately "fetch" for tens of minutes with no output.
	private static readonly SWIFTPM_REPO_CACHE = path.join(
		os.homedir(),
		"Library",
		"Caches",
		"org.swift.swiftpm",
		"repositories",
	);
	// Once a single package's clone passes this size, surface a one-time note
	// explaining why the fetch is slow (250 MB is already far beyond any
	// reasonably-hosted Swift package).
	private static readonly LARGE_CLONE_NOTE_BYTES = 250 * 1024 * 1024;
	// Lines of raw xcodebuild output kept for the failure report.
	private static readonly OUTPUT_TAIL_LINES = 25;

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
		// multiple plugins may declare the same package (e.g. a shared shim) —
		// only the first declaration is added; a second same-name package would
		// produce duplicate (and possibly conflicting) references in the pbxproj.
		const addedPluginPackageNames = new Set<string>();

		for (const pluginPkg of pluginPackages) {
			if (appPackageNames.has(pluginPkg.name)) {
				this.$logger.trace(
					`SPM: app package overrides plugin package: ${pluginPkg.name}`,
				);
			} else if (addedPluginPackageNames.has(pluginPkg.name)) {
				this.$logger.trace(
					`SPM: skipping duplicate plugin package: ${pluginPkg.name}`,
				);
			} else {
				addedPluginPackageNames.add(pluginPkg.name);
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

			// name every package and where it comes from — when resolution is
			// slow or fails, this is the first thing needed to tell WHICH
			// dependency is responsible.
			this.$logger.info(this.formatPackageListing(spmPackages));

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
					if (!this.$fs.exists(pkg.path)) {
						// surface this now — otherwise the only symptom is a cryptic
						// xcodebuild resolution failure much later.
						this.$logger.warn(
							`SPM: local package path for "${pkg.name}" does not exist: ${pkg.path} — Xcode will fail to resolve it.`,
						);
					}
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
			// best-effort, but don't bury the failure below trace level — a red
			// resolve spinner with no visible reason is confusing. Warn with the
			// message, keep the full error at trace.
			this.$logger.warn(
				`Failed to apply Swift Package dependencies: ${err?.message ?? err}`,
			);
			this.$logger.trace("SPM: error applying SPM packages: ", err);
		}
	}

	/**
	 * Resolves (downloads + pins) the Swift Package dependencies referenced by
	 * the Xcode project. On a first build this is where the NativeScript runtime
	 * (now distributed as a remote Swift package) and any other SPM packages are
	 * actually downloaded — which can take a while. Pass `showProgress` to render
	 * a live spinner so the CLI doesn't look stalled while that happens.
	 *
	 * In verbose mode (`--log trace`) the condensed spinner is bypassed and
	 * xcodebuild's raw resolution log is streamed straight through instead.
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

		// Without progress, or when verbose: let xcodebuild's own resolution log
		// stream straight to the terminal (inherited stdio). Verbose users want
		// the raw log, not a condensed spinner that hides it.
		if (!options?.showProgress || this.$logger.isVerbose()) {
			await this.$xcodebuildCommandService.executeCommand(args, {
				cwd: projectData.projectDir,
				message: "Resolving Swift Package dependencies...",
			});
			return;
		}

		const spinner = this.$terminalSpinnerService.createSpinner();
		const startedAt = Date.now();
		let activity = "Resolving Swift Package dependencies";
		let lineBuffer = "";
		// package currently being git-fetched (short name), if any — used to
		// measure its growing clone in the SwiftPM cache so a long silent fetch
		// shows visible progress ("2.31 GB of git history fetched") instead of
		// looking hung.
		let fetchingPackageRef: string = null;
		let fetchedBytes = 0;
		let largeCloneNoted = false;
		// rolling tail of raw xcodebuild output for the failure report.
		const outputTail: string[] = [];

		const render = () => {
			const elapsed = Math.round((Date.now() - startedAt) / 1000);
			const fetched =
				fetchedBytes > 0
					? ` — ${this.formatBytes(fetchedBytes)} of git history fetched`
					: "";
			spinner.text = `${activity}…${fetched} ${color.dim(`(${this.formatElapsed(elapsed)})`)}`;
		};
		// keep the elapsed timer ticking even when xcodebuild is silent (e.g.
		// while a repository clones or a binary artifact downloads) so the user
		// can see it's alive. Every 5th tick, measure the in-progress clone.
		let tickCount = 0;
		const ticker = setInterval(() => {
			tickCount++;
			if (fetchingPackageRef && tickCount % 5 === 0) {
				fetchedBytes = this.getPackageCloneSizeBytes(fetchingPackageRef);
				if (
					!largeCloneNoted &&
					fetchedBytes >= SPMService.LARGE_CLONE_NOTE_BYTES
				) {
					largeCloneNoted = true;
					// persist a one-time explanation above the spinner: this is the
					// point where users otherwise assume the CLI is stuck.
					spinner.stopAndPersist({
						symbol: color.yellow("ℹ"),
						text: color.yellow(
							`the "${fetchingPackageRef}" package is hosted in a repository with a large git history — ` +
								`SwiftPM clones the entire repository on first fetch, which can take a long time.${os.EOL}` +
								`  cache: ${SPMService.SWIFTPM_REPO_CACHE}`,
						),
					});
					spinner.start();
				}
			}
			render();
		}, 1000);

		const onProgress = (chunk: { data: string; pipe: string }) => {
			lineBuffer += chunk.data;
			// tolerate CRLF as well as LF so parsed lines never carry a stray \r
			const lines = lineBuffer.split(/\r?\n/);
			// keep the last (possibly partial) line in the buffer
			lineBuffer = lines.pop();
			for (const line of lines) {
				const trimmed = line.trim();
				if (trimmed) {
					this.$logger.trace(`SPM: ${trimmed}`);
					outputTail.push(trimmed);
					if (outputTail.length > SPMService.OUTPUT_TAIL_LINES) {
						outputTail.shift();
					}
				}
				const described = this.describeSPMActivity(line);
				if (described) {
					activity = described;
					// track which package a "Fetching <url>" line refers to so the
					// ticker can measure its clone; any other activity means the
					// fetch finished.
					if (/^Fetching\b/i.test(trimmed)) {
						fetchingPackageRef = this.shortenPackageRef(trimmed);
					} else {
						fetchingPackageRef = null;
						fetchedBytes = 0;
					}
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
			const elapsed = Math.round((Date.now() - startedAt) / 1000);
			spinner.succeed(
				color.green("Swift Package dependencies resolved") +
					color.dim(` (${this.formatElapsed(elapsed)})`),
			);
		} catch (err) {
			spinner.fail(color.red("Failed to resolve Swift Package dependencies"));
			// the spinner swallowed the raw log — replay the tail so the actual
			// xcodebuild error is visible without rerunning in verbose mode.
			if (outputTail.length) {
				this.$logger.info(color.dim("xcodebuild output (last lines):"));
				for (const line of outputTail) {
					this.$logger.info(color.dim(`  ${line}`));
				}
			}
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
			return this.describePackageActivity("Fetching", trimmed);
		}
		if (/^Cloning\b/i.test(trimmed)) {
			return this.describePackageActivity("Cloning", trimmed);
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

	/**
	 * Builds a stable, self-explanatory activity label with the package being
	 * worked on in parentheses, e.g. "Fetching Swift Packages (Auth0.swift)".
	 */
	private describePackageActivity(verb: string, line: string): string {
		const packageRef = this.shortenPackageRef(line);
		return packageRef
			? `${verb} Swift Packages (${packageRef})`
			: `${verb} Swift Packages`;
	}

	/**
	 * Extracts a short, readable name from a SwiftPM repo URL/log line, or null
	 * when the line contains no URL to name the package by.
	 */
	private shortenPackageRef(line: string): string | null {
		const match = line.match(/https?:\/\/\S+/);
		if (!match) {
			return null;
		}
		return path
			.basename(match[0])
			.replace(/\.git$/, "")
			.replace(/[)\s].*$/, "");
	}

	/** Formats an elapsed duration in whole seconds as "5m 15s". */
	private formatElapsed(totalSeconds: number): string {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}m ${seconds}s`;
	}

	/**
	 * Multi-line listing of every package and its source — one package per
	 * line, separated by the platform EOL so entries never clump together in
	 * terminal output on macOS, Windows, or Linux.
	 */
	private formatPackageListing(spmPackages: IosSPMPackage[]): string {
		return [
			"Swift Packages:",
			...spmPackages.map((pkg) => `  ${this.describePackageSource(pkg)}`),
		].join(os.EOL);
	}

	/**
	 * One-line description of a package and where it resolves from, e.g.
	 * "FontManager (1.0.12 · https://github.com/NativeScript/font-manager.git)"
	 * or "CanvasNative (local: node_modules/@nativescript/canvas/platforms/ios/NativeScriptV8)".
	 */
	private describePackageSource(pkg: IosSPMPackage): string {
		if ("path" in pkg) {
			return `${pkg.name} (local: ${pkg.path})`;
		}
		return `${pkg.name} (${pkg.version} · ${pkg.repositoryURL})`;
	}

	/**
	 * Size on disk of the SwiftPM cache clone(s) for a package ref (the short
	 * name produced by shortenPackageRef). Cache entries are named
	 * "<repo-name>-<hash>". Returns 0 when nothing is there (yet).
	 */
	private getPackageCloneSizeBytes(packageRef: string): number {
		let entries: fs.Dirent[];
		try {
			entries = fs.readdirSync(SPMService.SWIFTPM_REPO_CACHE, {
				withFileTypes: true,
			});
		} catch (err) {
			return 0;
		}
		let total = 0;
		for (const entry of entries) {
			if (
				entry.isDirectory() &&
				(entry.name === packageRef || entry.name.startsWith(`${packageRef}-`))
			) {
				total += this.getDirectorySizeBytes(
					path.join(SPMService.SWIFTPM_REPO_CACHE, entry.name),
				);
			}
		}
		return total;
	}

	/**
	 * Recursive directory size via the raw fs API. Tolerates files vanishing
	 * mid-walk (git renames its temp packfiles while cloning) and does not
	 * follow symlinks.
	 */
	private getDirectorySizeBytes(dirPath: string): number {
		let total = 0;
		const pending = [dirPath];
		while (pending.length) {
			const current = pending.pop();
			let entries: fs.Dirent[];
			try {
				entries = fs.readdirSync(current, { withFileTypes: true });
			} catch (err) {
				continue;
			}
			for (const entry of entries) {
				const fullPath = path.join(current, entry.name);
				try {
					if (entry.isDirectory()) {
						pending.push(fullPath);
					} else if (entry.isFile()) {
						total += fs.statSync(fullPath).size;
					}
				} catch (err) {
					// entry disappeared between readdir and stat — ignore
				}
			}
		}
		return total;
	}

	/** Formats a byte count as a short human-readable size ("2.31 GB"). */
	private formatBytes(bytes: number): string {
		const GB = 1024 ** 3;
		const MB = 1024 ** 2;
		if (bytes >= GB) {
			return `${(bytes / GB).toFixed(2)} GB`;
		}
		if (bytes >= MB) {
			return `${Math.round(bytes / MB)} MB`;
		}
		return `${Math.round(bytes / 1024)} KB`;
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
