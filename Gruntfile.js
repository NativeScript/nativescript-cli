const childProcess = require("child_process");
const EOL = require("os").EOL;
const now = new Date().toISOString();

const CONFIG_JSON_PATH = "config/config.json";

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
	var path = require("path");
	var commonLibNodeModules = path.join("lib", "common", "node_modules");
	if (require("fs").existsSync(commonLibNodeModules)) {
		grunt.file.delete(commonLibNodeModules);
	}
	grunt.file.write(path.join("lib", "common", ".d.ts"), "");

	grunt.initConfig({
		copyPackageTo: process.env["CopyPackageTo"] || ".",

		jobName: travis ? "travis" : (process.env["JOB_NAME"] || "local"),
		buildNumber: buildNumber,
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["lib/**/*.ts", "!lib/common/node_modules/**/*.ts"],
				reference: "lib/.d.ts"
			},

			devall: {
				src: ["lib/**/*.ts", "test/**/*.ts", "!lib/common/node_modules/**/*.ts", "lib/common/test/unit-tests/**/*.ts", "definitions/**/*.ts", "!lib/common/test/.d.ts"],
				reference: "lib/.d.ts"
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts", "!lib/common/node_modules/**/*.ts"],
				reference: "lib/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			},
		},

		watch: {
			devall: {
				files: ["lib/**/*.ts", 'test/**/*.ts', "!lib/common/node_modules/**/*.ts", "!lib/common/messages/**/*.ts"],
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
				files: ["lib/**/*.ts", 'test/**/*.ts', "!lib/common/node_modules/**/*.ts"],
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

		copy: {
			package_to_drop_folder: {
				src: "*.tgz",
				dest: "<%= copyPackageTo %>/<%= jobName %>/<%= dateString %> #<%= buildNumber %>/"
			},
			package_to_qa_drop_folder: {
				src: "*.tgz",
				dest: "<%= copyPackageTo %>/<%= jobName %>/nativescript.tgz"
			}
		},

		clean: {
			src: ["test/**/*.js*",
				"lib/**/*.js*",
				"!test-scripts/**/*",
				"!lib/common/vendor/*.js",
				"!lib/common/**/*.json",
				"!lib/common/Gruntfile.js",
				"!lib/common/node_modules/**/*",
				"!lib/common/hooks/**/*.js",
				"!lib/common/bin/*.js",
				"!lib/common/test-scripts/**/*",
				"!lib/common/scripts/**/*",
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
						"formatListOfNames": () => {},
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
		var buildVersion = version !== undefined ? version : buildNumber;
		if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
			buildVersion = "PR" + buildVersion;
		}

		var packageJson = grunt.file.readJSON("package.json");
		var versionParts = packageJson.version.split("-");
		if (process.env["RELEASE_BUILD"]) {
			// HACK - excluded until 1.0.0 release or we refactor our project infrastructure (whichever comes first)
			//			packageJson.version = versionParts[0];
		} else {
			versionParts[1] = buildVersion;
			packageJson.version = versionParts.join("-");
		}
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("tslint:build", function (version) {
		childProcess.execSync("npm run tslint", { stdio: "inherit" });
	});

	grunt.registerTask("enableScripts", function (enable) {
		var enableTester = /false/i;
		var newScriptsAttr = !enableTester.test(enable) ? "scripts" : "skippedScripts";
		var packageJson = grunt.file.readJSON("package.json");
		var oldScriptsAttrValue = packageJson.scripts || packageJson.skippedScripts;
		delete packageJson.scripts;
		delete packageJson.skippedScripts;
		packageJson[newScriptsAttr] = oldScriptsAttrValue;
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	const setConfig = (key, value) => {
		const configJson = grunt.file.readJSON(CONFIG_DATA.filePath);
		configJson[key] = value;
		const stringConfigContent = JSON.stringify(configJson, null, "	") + EOL;
		grunt.file.write(CONFIG_DATA.filePath, stringConfigContent);
	}

	grunt.registerTask("set_live_ga_id", function() {
		setConfig(CONFIG_DATA.gaKey, GA_TRACKING_IDS[ENVIRONMENTS.live]);
	});

	grunt.registerTask("set_dev_ga_id", function() {
		setConfig(CONFIG_DATA.gaKey, GA_TRACKING_IDS[ENVIRONMENTS.dev]);
	});

	grunt.registerTask("verify_live_ga_id", function() {
		var configJson = grunt.file.readJSON(CONFIG_DATA.filePath);

		if(configJson[CONFIG_DATA.gaKey] !== GA_TRACKING_IDS[ENVIRONMENTS.live]) {
			throw new Error("Google Analytics id is not configured correctly.");
		}
	});

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);
	grunt.registerTask("pack", [
		"clean",
		"ts:release_build",
		"shell:npm_test",

		"set_package_version",
		"set_live_ga_id",
		"verify_live_ga_id",
		"shell:build_package",

		"copy:package_to_drop_folder",
		"copy:package_to_qa_drop_folder",
		"set_dev_ga_id"
	]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "ts:devlib"]);
	grunt.registerTask("default", "ts:devlib");
	grunt.registerTask("docs-jekyll", ['template']);
};
