///<reference path="../../.d.ts"/>
"use strict";

import { ProjectBase } from "./project-base";

export class Project extends ProjectBase {
	constructor(protected $cordovaProjectCapabilities: Project.ICapabilities,
		protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $nativeScriptProjectCapabilities: Project.ICapabilities,
		protected $options: IOptions,
		protected $staticConfig: Config.IStaticConfig) {
		super($cordovaProjectCapabilities, $errors, $fs, $logger, $nativeScriptProjectCapabilities, $options, $staticConfig);
	}

	protected validate(): void { /* Currently unused */ }
	protected saveProjectIfNeeded(): void { /* Currently unused */ }
}
$injector.register("project", Project);
