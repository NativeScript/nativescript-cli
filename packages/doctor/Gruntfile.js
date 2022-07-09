module.exports = function (grunt) {
	grunt.initConfig({
		ts: {
			options: grunt.file.readJSON("tsconfig.json").compilerOptions,

			devsrc: {
				src: ["src/**/*.ts", "typings/**/*.ts"],
				reference: "src/.d.ts",
			},

			devall: {
				src: ["src/**/*.ts", "test/**/*.ts", "typings/**/*.ts"],
				reference: "src/.d.ts",
			},

			release_build: {
				src: ["src/**/*.ts", "test/**/*.ts", "typings/**/*.ts"],
				reference: "src/.d.ts",
				options: {
					sourceMap: false,
					removeComments: true,
				},
			},
		},

		tslint: {
			build: {
				files: {
					src: ["src/**/*.ts", "test/**/*.ts", "typings/**/*.ts", "!**/*.d.ts"],
				},
				options: {
					configuration: grunt.file.readJSON("./tslint.json"),
					project: "tsconfig.json",
				},
			},
		},

		watch: {
			devall: {
				files: ["src/**/*.ts", "test/**/*.ts"],
				tasks: ["ts:devall", "shell:npm_test"],
				options: {
					atBegin: true,
					interrupt: true,
				},
			},
			ts: {
				files: ["src/**/*.ts", "test/**/*.ts"],
				tasks: ["ts:devall"],
				options: {
					atBegin: true,
					interrupt: true,
				},
			},
		},

		shell: {
			options: {
				stdout: true,
				stderr: true,
				failOnError: true,
			},
			npm_test: {
				command: "npm test",
			},
		},

		clean: {
			src: [
				"test/**/*.js*",
				"src/**/*.js*",
				"!src/hooks/**/*.js",
				"!Gruntfile.js",
				"*.tgz",
			],
		},
	});

	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-shell");
	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks("grunt-tslint");

	grunt.registerTask("test", ["ts:devall", "shell:npm_test"]);
	grunt.registerTask("pack", ["clean", "ts:release_build", "shell:npm_test"]);
	grunt.registerTask("lint", ["tslint:build"]);
	grunt.registerTask("all", ["clean", "test", "lint"]);
	grunt.registerTask("rebuild", ["clean", "ts:devsrc"]);
	grunt.registerTask("default", "ts:devsrc");
};
