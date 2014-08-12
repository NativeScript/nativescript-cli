var util = require("util");

var now = new Date().toISOString();

function shallowCopy(obj) {
	var result = {};
	Object.keys(obj).forEach(function(key) {
		result[key] = obj[key];
	});
	return result;
}

var travis = process.env["TRAVIS"];
var buildNumber = process.env["TRAVIS_BUILD_NUMBER"] || process.env["BUILD_NUMBER"] || "non-ci";

module.exports = function(grunt) {
	grunt.initConfig({
		copyPackageTo: process.env["CopyPackageTo"] || ".",

		jobName: travis ? "travis" : (process.env["JOB_NAME"] || "local"),
		buildNumber: buildNumber,
		dateString: now.substr(0, now.indexOf("T")),

		pkg: grunt.file.readJSON("package.json"),

		ts: {
			options: {
				target: 'es5',
				module: 'commonjs',
				sourceMap: true,
				declaration: false,
				removeComments: false,
				noImplicitAny: true
			},

			devlib: {
				src: ["lib/**/*.ts"],
				reference: "lib/.d.ts"
			},

			devall: {
				src: ["lib/**/*.ts", "test/**/*.ts"],
				reference: "lib/.d.ts"
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts"],
				reference: "lib/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		watch: {
			devall: {
				files: ["lib/**/*.ts", 'test/**/*.ts'],
				tasks: [
					'ts:devall',
					'shell:npm_test'
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
						env: (function() {
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
			src: ["test/**/*.js*", "lib/**/*.js*", "!lib/common/vendor/*.js", "*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");

	grunt.registerTask("set_package_version", function(version) {
		var fs = require("fs");
		var buildVersion = version !== undefined ? version : buildNumber;
		if (process.env["BUILD_CAUSE_GHPRBCAUSE"]) {
			buildVersion = "PR" + buildVersion;
		}

		var packageJson = grunt.file.readJSON("package.json");
		var versionParts = packageJson.version.split("-");
		versionParts[1] = buildVersion;
		packageJson.version = versionParts.join("-");
		grunt.file.write("package.json", JSON.stringify(packageJson, null, "  "));
	});

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);
	grunt.registerTask("pack", [
		"clean",
		"ts:release_build",

		"set_package_version",
		"shell:build_package",

		"copy:package_to_drop_folder",
		"copy:package_to_qa_drop_folder"
	]);

	grunt.registerTask("default", "ts:devlib");
};
