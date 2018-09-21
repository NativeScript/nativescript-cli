const util = require("util");
const os = require("os");
const childProcess = require("child_process");

const now = new Date().toISOString();

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function (key) {
		result[key] = obj[key];
	});
	return result;
}

function getBuildVersion(version) {
	var buildVersion = version !== undefined ? version : process.env["BUILD_NUMBER"];
	if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
		buildVersion = "PR" + buildVersion;
	}

	return buildVersion;
}

module.exports = function (grunt) {

	// Windows cmd does not accept paths with / and unix shell does not accept paths with \\ and we need to execute from a sub-dir.
	// To circumvent the issue, hack our environment's PATH and let the OS deal with it, which in practice works
	process.env.path = process.env.path + (os.platform() === "win32" ? ";" : ":") + "node_modules/.bin";

	var defaultEnvironment = "sit";

	grunt.initConfig({
		jobName: process.env["JOB_NAME"] || defaultEnvironment,
		buildNumber: process.env["BUILD_NUMBER"] || "non-ci",
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),

		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["**/*.ts", "!node_modules/**/*.ts"],
				reference: ".d.ts"
			},

			devall: {
				src: ["**/*.ts", "!node_modules/**/*.ts", "test/**/*.ts"],
				reference: ".d.ts"
			},

			release_build: {
				src: ["**/*.ts", "!node_modules/**/*.ts", "test/**/*.ts"],
				reference: ".d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		watch: {
			devall: {
				files: ["**/*.ts", "!node_modules/**/*.ts", 'test/**/*.ts'],
				tasks: ['ts:devall'],
				options: {
					atBegin: true,
					interrupt: true
				}
			}
		},

		shell: {
			options: {
				stdout: true,
				stderr: true
			},

			ci_unit_tests: {
				command: "npm test",
				options: {
					execOptions: {
						env: (function () {
							var env = shallowCopy(process.env);
							env["XUNIT_FILE"] = "test-reports.xml";
							env["LOG_XUNIT"] = "true";
							return env;
						})()
					}
				}
			},

			build_package: {
				command: "npm pack",
				options: {
					execOptions: {
						env: (function () {
							var env = shallowCopy(process.env);
							env["COMMON_LIB_SKIP_POSTINSTALL_TASKS"] = "1";
							return env;
						})()
					}
				}
			}
		},

		clean: {
			src: ["test/**/*.js*",
				"**/*.js*",
				"!**/*.json",
				"!Gruntfile.js",
				"!node_modules/**/*",
				"!bin/common-lib.js",
				"!vendor/*.js",
				"*.tgz",
				"!test-scripts/**/*",
				"!scripts/**/*"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");

	grunt.registerTask("set_package_version", function (version) {
		var buildVersion = getBuildVersion(version);
		var packageJson = grunt.file.readJSON("package.json");
		packageJson.buildVersion = buildVersion;
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("tslint:build", function (version) {
		childProcess.execSync("npm run tslint", { stdio: "inherit" });
	});

	grunt.registerTask("setPackageName", function (version) {
		var fs = require("fs");
		var fileExtension = ".tgz";
		var buildVersion = getBuildVersion(version);
		var packageJson = grunt.file.readJSON("package.json");
		var oldFileName = packageJson.name + "-" + packageJson.version + fileExtension;
		if (buildVersion) {
			var newFileName = oldFileName + "-" + buildVersion + fileExtension;
			fs.renameSync(oldFileName, newFileName);
			console.log("Renamed " + oldFileName + " to " + newFileName);
		} else {
			console.log("Packed file is: " + oldFileName);
		}
	});

	grunt.registerTask("delete_coverage_dir", function () {
		var done = this.async();
		var rimraf = require("rimraf");
		rimraf("coverage", function (err) {
			if (err) {
				console.log("Error while deleting coverage directory from the package.");
				done(false);
			}

			done();
		});
	});

	grunt.registerTask("test", ["ts:devall", "shell:ci_unit_tests"]);
	grunt.registerTask("pack", [
		"tslint:build",
		"ts:release_build",
		"shell:ci_unit_tests",

		"set_package_version",
		"delete_coverage_dir",
		"shell:build_package",
		"setPackageName"
	]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("default", "ts:devlib");
	grunt.registerTask("all", ["clean", "test", "lint"]);
};
