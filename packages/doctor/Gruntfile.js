module.exports = function (grunt) {
	grunt.initConfig({
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devlib: {
				src: ["lib/**/*.ts", "typings/**/*.ts"],
				reference: "lib/.d.ts"
			},

			devall: {
				src: ["lib/**/*.ts", "test/**/*.ts", "typings/**/*.ts"],
				reference: "lib/.d.ts"
			},

			release_build: {
				src: ["lib/**/*.ts", "test/**/*.ts", "typings/**/*.ts"],
				reference: "lib/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true
				}
			}
		},

		tslint: {
			build: {
				files: {
					src: ["lib/**/*.ts", "test/**/*.ts", "typings/**/*.ts", "!**/*.d.ts"]
				},
				options: {
					configuration: grunt.file.readJSON("./tslint.json"),
					project: "tsconfig.json"
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
			},
			ts: {
				files: ["lib/**/*.ts", "test/**/*.ts"],
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
				command: "npm pack"
			},
			npm_test: {
				command: "npm test"
			}
		},

		clean: {
			src: ["test/**/*.js*", "lib/**/*.js*", "!lib/hooks/**/*.js", "!Gruntfile.js", "*.tgz"]
		}
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-tslint");

	grunt.registerTask("delete_coverage_dir", function () {
		var done = this.async();
		var rimraf = require("rimraf");
		rimraf("coverage", function (err) {
			if (err) {
				console.log("Error while deleting coverage directory from the package: ", err);
				done(false);
			}

			done();
		});
	});

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);

	grunt.registerTask("pack", [
		"clean",
		"ts:release_build",
		"shell:npm_test",
		"delete_coverage_dir",
		"shell:build_package"
	]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "ts:devlib"]);
	grunt.registerTask("default", "ts:devlib");
};
