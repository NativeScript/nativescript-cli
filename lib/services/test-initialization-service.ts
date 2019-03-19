import * as path from "path";
import { cache } from "../common/decorators";

export class TestInitializationService implements ITestInitializationService {
	private configsPath = path.join(__dirname, "..", "..", "config");

	constructor(private $errors: IErrors,
		private $fs: IFileSystem) { }

	@cache()
	public getDependencies(selectedFramework: string): IDependencyInformation[] {
		const dependenciesPath = path.join(this.configsPath, "test-dependencies.json");
		const allDependencies: { name: string, framework?: string, excludedPeerDependencies?: string[] }[] = this.$fs.readJson(dependenciesPath);

		const dependenciesVersionsPath = path.join(this.configsPath, "test-deps-versions-generated.json");
		const dependenciesVersions = this.$fs.readJson(dependenciesVersionsPath);

		const targetFrameworkDependencies: IDependencyInformation[] = allDependencies
			.filter(dependency => !dependency.framework || dependency.framework === selectedFramework)
			.map(dependency => {
				const dependencyVersion = dependenciesVersions[dependency.name];
				if (!dependencyVersion) {
					this.$errors.failWithoutHelp(`'${dependency}' is not a registered dependency.`);
				}
				return { ...dependency, version: dependencyVersion };
			});

		return targetFrameworkDependencies;
	}
}

$injector.register("testInitializationService", TestInitializationService);
