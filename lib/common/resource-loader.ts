import * as path from "path";

export class ResourceLoader implements IResourceLoader {
	constructor(private $fs: IFileSystem,
		private $staticConfig: Config.IStaticConfig) { }

	resolvePath(resourcePath: string): string {
		return path.join(this.$staticConfig.RESOURCE_DIR_PATH, resourcePath);
	}

	openFile(resourcePath: string): NodeJS.ReadableStream {
		return this.$fs.createReadStream(this.resolvePath(resourcePath));
	}

	readText(resourcePath: string): string {
		return this.$fs.readText(this.resolvePath(resourcePath));
	}

	readJson(resourcePath: string): any {
		return this.$fs.readJson(this.resolvePath(resourcePath));
	}

	public getPathToAppResources(framework: string): string {
		return path.join(this.resolvePath(framework), this.$staticConfig.APP_RESOURCES_DIR_NAME);
	}
}
$injector.register("resources", ResourceLoader);
