import * as path from "path";
import { Configurations } from "../common/constants";

export class XcconfigService implements IXcconfigService {
	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $xcprojService: IXcprojService) { }

	public getPluginsXcconfigFilePaths(projectRoot: string): IStringDictionary {
		return {
			[Configurations.Debug.toLowerCase()]: this.getPluginsDebugXcconfigFilePath(projectRoot),
			[Configurations.Release.toLowerCase()]: this.getPluginsReleaseXcconfigFilePath(projectRoot)
		};
	}

	private getPluginsDebugXcconfigFilePath(projectRoot: string): string {
		return path.join(projectRoot, "plugins-debug.xcconfig");
	}

	private getPluginsReleaseXcconfigFilePath(projectRoot: string): string {
		return path.join(projectRoot, "plugins-release.xcconfig");
	}

	public async mergeFiles(sourceFile: string, destinationFile: string): Promise<void> {
		if (!this.$fs.exists(destinationFile)) {
			this.$fs.writeFile(destinationFile, "");
		}

		// TODO: Consider to remove this method
		await this.$xcprojService.checkIfXcodeprojIsRequired();

		const escapedDestinationFile = destinationFile.replace(/'/g, "\\'");
		const escapedSourceFile = sourceFile.replace(/'/g, "\\'");

		const mergeScript = `require 'xcodeproj'; Xcodeproj::Config.new('${escapedDestinationFile}').merge(Xcodeproj::Config.new('${escapedSourceFile}')).save_as(Pathname.new('${escapedDestinationFile}'))`;
		await this.$childProcess.exec(`ruby -e "${mergeScript}"`);
	}

	public readPropertyValue(xcconfigFilePath: string, propertyName: string): string {
		if (this.$fs.exists(xcconfigFilePath)) {
			const text = this.$fs.readText(xcconfigFilePath);

			let property: string;
			let isPropertyParsed: boolean = false;
			text.split(/\r?\n/).forEach((line) => {
				line = line.replace(/\/(\/)[^\n]*$/, "");
				if (line.indexOf(propertyName) >= 0) {
					const parts = line.split("=");
					if (parts.length > 1 && parts[1]) {
						property = parts[1].trim();
						isPropertyParsed = true;
						if (property[property.length - 1] === ';') {
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

$injector.register("xcconfigService", XcconfigService);
