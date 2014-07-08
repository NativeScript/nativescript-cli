///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import shell = require("shelljs");
var options = require("./../options");
var helpers = require("./../common/helpers");

export class ProjectTemplatesService implements IProjectTemplatesService {
	private static GITHUB_REPOS_ENDPOINT = "https://api.github.com/orgs/Telerik/repos?per_page=100";
	private static GITHUB_DEFAULT_TEMPLATE_REFS_ENDPOINT = "https://api.github.com/repos/telerik/nativescript-sample-cuteness/git/refs";
	private static GITHUB_MASTER_REF_NAME = "refs/heads/master";
	private static GITHUB_DEFAULT_TEMPLATE_REPO_NAME = "nativescript-sample-cuteness";
	private static DEFAULT_TEMPLATE_PULL_FAILED_MESSAGE = "Failed to retrieve Cuteness application. Please try again a little bit later.";
	private static DEFAULT_TEMPLATE_NAME = "Cuteness";

	public constructor(private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem) { }

	public get defaultTemplatePath(): IFuture<string> {
		return this.getDefaultTemplatePath();
	}

	private getDefaultTemplatePath(): IFuture<string> {
		return (() => {
			var latestMasterCommitSha = this.getLatestMasterCommitSha().wait();
			var downloadDir = path.join(options["profile-dir"], ProjectTemplatesService.DEFAULT_TEMPLATE_NAME);

			var defaultTemplatePath = path.join(downloadDir, util.format("telerik-%s-%s", ProjectTemplatesService.GITHUB_DEFAULT_TEMPLATE_REPO_NAME, latestMasterCommitSha));
			if(this.$fs.exists(defaultTemplatePath).wait()) {
				this.$logger.trace("Cuteness app already exists. No need to download.");
				return path.join(defaultTemplatePath, ProjectTemplatesService.GITHUB_DEFAULT_TEMPLATE_REPO_NAME);
			}

			try {
				var repos = JSON.parse(this.$httpClient.httpRequest(ProjectTemplatesService.GITHUB_REPOS_ENDPOINT).wait().body);
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(ProjectTemplatesService.DEFAULT_TEMPLATE_PULL_FAILED_MESSAGE);
			}

			var defaultTemplateRepo = _.find(repos, (repo: any) => { return repo.name == ProjectTemplatesService.GITHUB_DEFAULT_TEMPLATE_REPO_NAME; });
			var defaultTemplateUrl = util.format("%s/%s/%s", defaultTemplateRepo.url, "zipball", defaultTemplateRepo.default_branch);

			if(!this.$fs.exists(downloadDir).wait()) {
				this.$fs.createDirectory(downloadDir).wait();
			}

			this.$logger.trace("Downloading %s cuteness app", latestMasterCommitSha);

			var file = this.$fs.createWriteStream(defaultTemplatePath);
			var fileEnd = this.$fs.futureFromEvent(file, "finish");

			this.$httpClient.httpRequest({ url: defaultTemplateUrl, pipeTo: file}).wait();
			fileEnd.wait();

			this.$fs.unzip(defaultTemplatePath, downloadDir).wait();

			this.$logger.trace("Downloaded, unzipped and extracted %s ", defaultTemplatePath);

			return path.join(defaultTemplatePath, ProjectTemplatesService.GITHUB_DEFAULT_TEMPLATE_REPO_NAME);
		}).future<string>()();
	}

	private getLatestMasterCommitSha(): IFuture<string> {
		return (() => {
			try {
				var refs = JSON.parse(this.$httpClient.httpRequest(ProjectTemplatesService.GITHUB_DEFAULT_TEMPLATE_REFS_ENDPOINT).wait().body);
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(ProjectTemplatesService.DEFAULT_TEMPLATE_PULL_FAILED_MESSAGE);
			}

			var masterRef = _.find(refs, (ref: any) => { return ref.ref == ProjectTemplatesService.GITHUB_MASTER_REF_NAME});
			var masterRefSha = masterRef.object.sha;

			return masterRefSha.toString().substr(0, 7);
		}).future<string>()();
	}
}
$injector.register("projectTemplatesService", ProjectTemplatesService);