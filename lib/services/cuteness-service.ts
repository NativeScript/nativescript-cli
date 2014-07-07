///<reference path="../.d.ts"/>

import util = require("util");
import path = require("path");
import shell = require("shelljs");
var options = require("./../options");
var helpers = require("./../common/helpers");

export class CutenessService implements ICutenessService {
	private static GITHUB_REPOS_ENDPOINT = "https://api.github.com/orgs/Telerik/repos?per_page=100";
	private static GITHUB_CUTENESS_REFS_ENDPOINT = "https://api.github.com/repos/telerik/nativescript-sample-cuteness/git/refs";
	private static GITHUB_MASTER_REF_NAME = "refs/heads/master";
	private static GITHUB_CUTENESS_REPO_NAME = "nativescript-sample-cuteness";
	private static CUTENESS_PULL_FAILED_MESSAGE = "Failed to retrieve Cuteness application. Please try again a little bit later.";
	private static CUTENESS_NAME = "Cuteness";

	public constructor(private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $errors: IErrors,
		private $fs: IFileSystem) { }

	public get cutenessPath(): IFuture<string> {
		return this.getCutenessPath();
	}

	private getCutenessPath(): IFuture<string> {
		return (() => {
			var latestMasterCommitSha = this.getLatestMasterCommitSha().wait();
			var downloadDir = path.join(options["profile-dir"], CutenessService.CUTENESS_NAME);

			var cutenessAppPath = path.join(downloadDir, util.format("telerik-%s-%s", CutenessService.GITHUB_CUTENESS_REPO_NAME, latestMasterCommitSha));
			if(this.$fs.exists(cutenessAppPath).wait()) {
				this.$logger.trace("Cuteness app already exists. No need to download.");
				return path.join(cutenessAppPath, CutenessService.GITHUB_CUTENESS_REPO_NAME);
			}

			try {
				var repos = JSON.parse(this.$httpClient.httpRequest(CutenessService.GITHUB_REPOS_ENDPOINT).wait().body);
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(CutenessService.CUTENESS_PULL_FAILED_MESSAGE);
			}

			var cutenessRepo = _.find(repos, (repo: any) => { return repo.name == CutenessService.GITHUB_CUTENESS_REPO_NAME; });
			var cutenessUrl = util.format("%s/%s/%s", cutenessRepo.url, "zipball", cutenessRepo.default_branch);

			if(!this.$fs.exists(downloadDir).wait()) {
				this.$fs.createDirectory(downloadDir).wait();
			}

			this.$logger.trace("Downloading %s cuteness app", latestMasterCommitSha);

			var file = this.$fs.createWriteStream(cutenessAppPath);
			var fileEnd = this.$fs.futureFromEvent(file, "finish");

			this.$httpClient.httpRequest({ url: cutenessUrl, pipeTo: file}).wait();
			fileEnd.wait();

			this.$fs.unzip(cutenessAppPath, downloadDir).wait();

			this.$logger.trace("Downloaded, unzipped and extracted %s ", cutenessAppPath);

			return path.join(cutenessAppPath, CutenessService.GITHUB_CUTENESS_REPO_NAME);
		}).future<string>()();
	}

	private getLatestMasterCommitSha(): IFuture<string> {
		return (() => {
			try {
				var refs = JSON.parse(this.$httpClient.httpRequest(CutenessService.GITHUB_CUTENESS_REFS_ENDPOINT).wait().body);
			} catch(error) {
				this.$logger.debug(error);
				this.$errors.fail(CutenessService.CUTENESS_PULL_FAILED_MESSAGE);
			}

			var masterRef = _.find(refs, (ref: any) => { return ref.ref == CutenessService.GITHUB_MASTER_REF_NAME});
			var masterRefSha = masterRef.object.sha;

			return masterRefSha.toString().substr(0, 7);
		}).future<string>()();
	}
}
$injector.register("cutenessService", CutenessService);