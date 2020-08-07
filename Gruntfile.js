const childProcess = require("child_process");
const EOL = require("os").EOL;
const path = require("path");
const now = new Date().toISOString();
const latestVersion = require('latest-version');

const ENVIRONMENTS = {
	live: "live",
	dev: "dev"
};

const GA_TRACKING_IDS = {
	[ENVIRONMENTS.dev]: "UA-111455-51",
	[ENVIRONMENTS.live]: "UA-111455-44"
};

const CONFIG_DATA = {
	filePath: "config/config.json",
	gaKey: "GA_TRACKING_ID"
}

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function (key) {
		result[key] = obj[key];
	});
	return result;
}

var travis = process.env["TRAVIS"];
var buildNumber = process.env["PACKAGE_VERSION"] || process.env["BUILD_NUMBER"] || "non-ci";

module.exports = function (grunt) {
	grunt.initConfig({
		copyPackageTo: process.env["CopyPackageTo"] || ".",

		jobName: travis ? "travis" : (process.env["JOB_NAME"] || "local"),
		buildNumber: buildNumber,
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["src/**/*.ts", "!src/common/node_modules/**/*.ts"],
				reference: "src/.d.ts"
			},

			devall: {
				src: ["src/**/*.ts", "test/**/*.ts", "!src/common/node_modules/**/*.ts", "src/common/test/unit-tests/**/*.ts", "definitions/**/*.ts", "!src/common/test/.d.ts"],
				reference: "src/.d.ts"
			},

			release_build: {
				src: ["src/**/*.ts", "test/**/*.ts", "!src/common/node_modules/**/*.ts"],
				reference: "src/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			},
		},

		watch: {
			devall: {
				files: ["src/**/*.ts", 'test/**/*.ts', "!src/common/node_modules/**/*.ts", "!src/common/messages/**/*.ts"],
				tasks: [
					'ts:devall',
					'shell:npm_test'
				],
				options: {
					atBegin: true,
					interrupt: true
				}
			},
			ts: {
				files: ["src/**/*.ts", 'test/**/*.ts', "!src/common/node_modules/**/*.ts"],
				tasks: [
					'ts:devall'
				],
				options: {
					atBegin: true,
					interrupt: true
				}
			}
		},

		shell: {
			options: {
				stdout: true,
				stderr: true,
				failOnError: true
			},

			build_package: {
				command: "npm pack",
				options: {
					execOptions: {
						env: (function () {
							var env = shallowCopy(process.env);
							env["NATIVESCRIPT_SKIP_POSTINSTALL_TASKS"] = "1";
							return env;
						})()
					}
				}
			},

			npm_test: {
				command: "npm test"
			}

		},

		clean: {
			src: ["test/**/*.js*",
				"!test/files/**/*.js*",
				"src/**/*.js*",
				"!test-scripts/**/*",
				"!src/common/vendor/*.js",
				"!src/common/**/*.json",
				"!src/common/Gruntfile.js",
				"!src/common/node_modules/**/*",
				"!src/common/hooks/**/*.js",
				"!src/common/bin/*.js",
				"!src/common/test-scripts/**/*",
				"!src/common/scripts/**/*",
				"!src/common/test/resources/**/*",
				"*.tgz"]
		},
		template: {
			'process-markdowns': {
				options: {
					data: {
						"isJekyll": true,
						"isHtml": true,
						"isConsole": true,
						"isWindows": true,
						"isMacOS": true,
						"isLinux": true,
						"constants": ""
					}
				},
				files: [{
					expand: true,
					cwd: "docs/man_pages/",
					src: "**/*.md",
					dest: "docs-cli/",
					ext: ".md"
				}]
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-template");

	grunt.registerTask("set_package_version", function (version) {
		// NOTE: DO NOT call this task in npm's prepack script - it will change the version in package.json,
		// but npm will still try to publish the version that was originally specified in the package.json/
		// Also this may break some Jenkins builds as the produced package will have unexpected name.
		var buildVersion = version !== undefined ? version : buildNumber;
		if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
			buildVersion = "PR" + buildVersion;
		}

		var packageJson = grunt.file.readJSON("package.json");
		var versionParts = packageJson.version.split("-");

		// The env is used in Jenkins job to produce package that will be releasd with "latest" tag in npm (i.e. strict version).
		if (!process.env["RELEASE_BUILD"]) {
			versionParts[1] = buildVersion;
			packageJson.version = versionParts.join("-");
		}

		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("tslint:build", function (version) {
		childProcess.execSync("npm run tslint", { stdio: "inherit" });
	});

	const setConfig = (key, value) => {
		const configJson = grunt.file.readJSON(CONFIG_DATA.filePath);
		configJson[key] = value;
		const stringConfigContent = JSON.stringify(configJson, null, "	") + EOL;
		grunt.file.write(CONFIG_DATA.filePath, stringConfigContent);
	}

	grunt.registerTask("set_live_ga_id", function () {
		setConfig(CONFIG_DATA.gaKey, GA_TRACKING_IDS[ENVIRONMENTS.live]);
	});

	grunt.registerTask("set_dev_ga_id", function () {
		setConfig(CONFIG_DATA.gaKey, GA_TRACKING_IDS[ENVIRONMENTS.dev]);
	});

	grunt.registerTask("verify_live_ga_id", function () {
		var configJson = grunt.file.readJSON(CONFIG_DATA.filePath);

		if (configJson[CONFIG_DATA.gaKey] !== GA_TRACKING_IDS[ENVIRONMENTS.live]) {
			throw new Error("Google Analytics id is not configured correctly.");
		}
	});

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);

	registerTestingDependenciesTasks(grunt);

	grunt.registerTask("prepare", [
		"clean",
		"ts:release_build",
		"generate_unit_testing_dependencies",
		"verify_unit_testing_dependencies",
		"shell:npm_test",

		"set_live_ga_id",
		"verify_live_ga_id"
	]);
	grunt.registerTask("pack", [
		"set_package_version",
		"shell:build_package"
	]);

	grunt.registerTask("travisPack", function () {
		if (travis && process.env.TRAVIS_PULL_REQUEST_BRANCH) {
			return grunt.task.run("pack");
		}

		// Set correct version in Travis job, so the deploy will not publish strict version (for example 5.2.0).
		grunt.task.run("set_package_version");
		console.log(`Skipping pack step as the current build is not from PR, so it will be packed from the deploy provider.`);
	});
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "default"]);
	grunt.registerTask("default", ["ts:devlib", "generate_unit_testing_dependencies"]);
	grunt.registerTask("docs-jekyll", ['template']);
};

function registerTestingDependenciesTasks(grunt) {
	const configsBasePath = path.join(__dirname, "config");
	const generatedVersionFilePath = path.join(configsBasePath, "test-deps-versions-generated.json");

	grunt.registerTask("generate_unit_testing_dependencies", async function () {
		var done = this.async();
		const dependenciesVersions = {};
		const testDependencies = grunt.file.readJSON(path.join(configsBasePath, "test-dependencies.json"));
		for (var dependency of testDependencies) {
			const dependencyVersion = dependency.version || await latestVersion(dependency.name);
			dependenciesVersions[dependency.name] = dependencyVersion;
		}
		grunt.file.write(generatedVersionFilePath, JSON.stringify(dependenciesVersions));
		done();
	});

	grunt.registerTask("verify_unit_testing_dependencies", function () {
		if (!grunt.file.exists(generatedVersionFilePath)) {
			throw new Error("Unit testing dependencies are not configured.");
		}
	});
}

