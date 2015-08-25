///<reference path="../.d.ts"/>
"use strict";

export class ProjectTemplatesService implements IProjectTemplatesService {
	private static NPM_DEFAULT_TEMPLATE_NAME = "tns-template-hello-world";

	public constructor(private $npmInstallationManager: INpmInstallationManager) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.$npmInstallationManager.install(ProjectTemplatesService.NPM_DEFAULT_TEMPLATE_NAME);
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);
