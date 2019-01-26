///<reference path="../../.d.ts"/>
"use strict";

import { ProjectBase } from "./project-base";

export class Project extends ProjectBase {
	constructor(protected $errors: IErrors,
		protected $fs: IFileSystem,
		protected $logger: ILogger,
		protected $options: IOptions,
		protected $staticConfig: Config.IStaticConfig) {
		super($errors, $fs, $logger, $options, $staticConfig);
	}

	protected validate(): void { /* Currently unused */ }
	protected saveProjectIfNeeded(): void { /* Currently unused */ }
}
$injector.register("project", Project);
