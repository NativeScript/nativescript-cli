///<reference path="../.d.ts"/>
"use strict";
import path = require("path");

require("./../bootstrap");
import fiberBootstrap = require("./../fiber-bootstrap");
fiberBootstrap.run(() => {
	$injector.require("typeScriptCompilationService", "./common/services/typescript-compilation-service");

	var $projectData: IProjectData = $injector.resolve("$projectData");
	var $fs: IFileSystem = $injector.resolve("fs");
	var projectFiles = $fs.enumerateFilesInDirectorySync($projectData.projectDir);

	var typeScriptFiles = _.filter(projectFiles, file => path.extname(file) === ".ts");
	var definitionFiles = _.filter(typeScriptFiles, file => _.endsWith(file, ".d.ts"));

	if(typeScriptFiles.length > definitionFiles.length) { // We need this check because some of non-typescript templates contain typescript definition files
		var typeScriptCompilationService = $injector.resolve("typeScriptCompilationService");
		typeScriptCompilationService.initialize(typeScriptFiles);
		typeScriptCompilationService.compileAllFiles().wait();
	}
});
