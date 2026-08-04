import * as path from "path";
import { Configurations } from "../common/constants";
import { IXcconfigService } from "../declarations";
import {
	IChildProcess,
	IFileSystem,
	IStringDictionary,
} from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";

export class XcconfigService implements IXcconfigService {
	private static readonly CONFLICT_MARKER = "NS_XCCONFIG_CONFLICTS:";

	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $logger: ILogger,
	) {}

	public getPluginsXcconfigFilePaths(projectRoot: string): IStringDictionary {
		return {
			[Configurations.Debug.toLowerCase()]:
				this.getPluginsDebugXcconfigFilePath(projectRoot),
			[Configurations.Release.toLowerCase()]:
				this.getPluginsReleaseXcconfigFilePath(projectRoot),
		};
	}

	private getPluginsDebugXcconfigFilePath(projectRoot: string): string {
		return path.join(projectRoot, "plugins-debug.xcconfig");
	}

	private getPluginsReleaseXcconfigFilePath(projectRoot: string): string {
		return path.join(projectRoot, "plugins-release.xcconfig");
	}

	public async mergeFiles(
		sourceFile: string,
		destinationFile: string,
	): Promise<void> {
		if (!this.$fs.exists(destinationFile)) {
			this.$fs.writeFile(destinationFile, "");
		}

		// A key already present in the destination wins, so the incoming one is
		// dropped. Report the drops whose values actually differ: a silently
		// discarded setting is otherwise indistinguishable from one that was
		// never written, which makes a plugin pinning e.g.
		// CLANG_CXX_LANGUAGE_STANDARD very hard to track down.
		//
		// The paths are passed as argv rather than interpolated: they come from
		// the project and node_modules layout, and a shell-interpolated command
		// would execute anything a directory name expands to.
		const mergeScript = `require 'xcodeproj'
		require 'json'
		destination, source = ARGV
		userConfig = Xcodeproj::Config.new(destination)
		existingConfig = Xcodeproj::Config.new(source)
		conflicts = []
		userConfig.attributes.each do |key, kept|
			if existingConfig.attributes.key?(key)
				ignored = existingConfig.attributes[key]
				conflicts << { 'key' => key, 'kept' => kept.to_s, 'ignored' => ignored.to_s } if ignored.to_s != kept.to_s
				existingConfig.attributes.delete(key)
			end
		end
		userConfig.merge(existingConfig).save_as(Pathname.new(destination))
		print '${XcconfigService.CONFLICT_MARKER}' + JSON.generate(conflicts)`;
		const output = await this.$childProcess.execFile("ruby", [
			"-e",
			mergeScript,
			destinationFile,
			sourceFile,
		]);
		this.warnAboutConflicts(sourceFile, output);
	}

	private warnAboutConflicts(sourceFile: string, output: any): void {
		const text: string =
			output === null || output === undefined ? "" : `${output}`;
		const markerIndex = text.lastIndexOf(XcconfigService.CONFLICT_MARKER);
		if (markerIndex === -1) {
			return;
		}

		let conflicts: { key: string; kept: string; ignored: string }[];
		try {
			conflicts = JSON.parse(
				text.substring(markerIndex + XcconfigService.CONFLICT_MARKER.length),
			);
		} catch (err) {
			// Never let a reporting problem fail the merge itself.
			this.$logger.trace(
				`Unable to read xcconfig conflicts for ${sourceFile}: ${err}`,
			);
			return;
		}

		for (const conflict of conflicts || []) {
			this.$logger.warn(
				`Ignoring ${conflict.key} = ${conflict.ignored} from ${sourceFile}: ` +
					`already set to ${conflict.kept} by a higher precedence xcconfig. ` +
					`The app's App_Resources xcconfig is applied first, then each ` +
					`plugin's in dependency order.`,
			);
		}
	}

	public readPropertyValue(
		xcconfigFilePath: string,
		propertyName: string,
	): string {
		if (this.$fs.exists(xcconfigFilePath)) {
			const text = this.$fs.readText(xcconfigFilePath);

			let property: string;
			let isPropertyParsed: boolean = false;
			text.split(/\r?\n/).forEach((line: string) => {
				line = line.replace(/\/(\/)[^\n]*$/, "");
				if (line.indexOf(propertyName) >= 0) {
					const parts = line.split("=");
					if (parts.length > 1 && parts[1]) {
						property = parts[1].trim();
						isPropertyParsed = true;
						if (property[property.length - 1] === ";") {
							property = property.slice(0, -1);
						}
					}
				}
			});

			if (isPropertyParsed) {
				// property can be an empty string, so we don't check for that.
				return property;
			}
		}

		return null;
	}
}

injector.register("xcconfigService", XcconfigService);
