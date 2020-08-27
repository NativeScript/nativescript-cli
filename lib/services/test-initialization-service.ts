import * as path from "path";
import * as fs from "fs";
import { cache } from "../common/decorators";
import { ITestInitializationService } from "../definitions/project";
import {
	IErrors,
	IFileSystem,
	IDependencyInformation,
} from "../common/declarations";
import * as _ from "lodash";
import { injector } from "../common/yok";

export class TestInitializationService implements ITestInitializationService {
	private configsPath = path.join(__dirname, "..", "..", "config");

	constructor(private $errors: IErrors, private $fs: IFileSystem) {}

	@cache()
	public getDependencies(selectedFramework: string): IDependencyInformation[] {
		const dependenciesPath = path.join(
			this.configsPath,
			"test-dependencies.json"
		);
		const allDependencies: {
			name: string;
			framework?: string;
			excludedPeerDependencies?: string[];
		}[] = this.$fs.readJson(dependenciesPath);

		const dependenciesVersionsPath = path.join(
			this.configsPath,
			"test-deps-versions-generated.json"
		);
		const dependenciesVersions = this.$fs.readJson(dependenciesVersionsPath);

		const targetFrameworkDependencies: IDependencyInformation[] = allDependencies
			.filter(
				(dependency) =>
					!dependency.framework || dependency.framework === selectedFramework
			)
			.map((dependency) => {
				const dependencyVersion = dependenciesVersions[dependency.name];
				if (!dependencyVersion) {
					this.$errors.fail(`'${dependency}' is not a registered dependency.`);
				}
				return { ...dependency, version: dependencyVersion };
			});

		return targetFrameworkDependencies;
	}

	/**
	 * This method is used from test-init.md file so it is not allowed to use "this" inside the method's body.
	 */
	@cache()
	public getFrameworkNames(): string[] {
		const configsPath = path.join(__dirname, "..", "..", "config");
		const dependenciesPath = path.join(configsPath, "test-dependencies.json");
		const allDependencies: { name: string; framework?: string }[] = JSON.parse(
			fs.readFileSync(dependenciesPath, { encoding: "utf-8" })
		);
		const frameworks = _.uniqBy(allDependencies, "framework")
			.map((item) => item && item.framework)
			.filter((item) => item);

		return frameworks;
	}
}

injector.register("testInitializationService", TestInitializationService);
