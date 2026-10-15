import * as fs from "fs";
import { StringCommandParameter } from "../common/command-params";
import { IErrors, IFileSystem, IOpener } from "../common/declarations";
import { ICommand, ICommandParameter } from "../common/definitions/commands";
import { IInjector } from "../common/definitions/yok";
import { OptionType } from "../common/enums";
import { isInteractive } from "../common/helpers";
import { injector } from "../common/yok";
import { IOptions } from "../declarations";
import { IProjectData } from "../definitions/project";
import {
	CompiledReportService,
	ICompiledReport,
	ICompiledReportDraft,
	IReportedIssue,
	ISSUES_REPO,
	newIssueUrl,
} from "../services/compiled-report-service";

/**
 * `ns compiled report [ios|android]`: turns the last failed `--compiled` build
 * (or, with `--error <file>`, a compiled app's runtime error) into an issue on
 * NativeScript/NativeScript. The report is shown before anything is sent, and the
 * app's code is included only after a second confirmation, which `--yes` never skips.
 */
export class CompiledReportCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [
		new StringCommandParameter(this.$injector),
	];
	public dashedOptions = {
		error: { type: OptionType.String, hasSensitiveValue: true },
		yes: { type: OptionType.Boolean, alias: "y", hasSensitiveValue: false },
	};

	constructor(
		private $compiledReportService: CompiledReportService,
		private $errors: IErrors,
		private $fs: IFileSystem,
		private $injector: IInjector,
		private $logger: ILogger,
		private $opener: IOpener,
		private $options: IOptions & { error?: string; yes?: boolean },
		private $projectData: IProjectData,
		private $prompter: IPrompter,
	) {}

	public async execute(args: string[]): Promise<void> {
		const platform = args[0]?.toLowerCase();
		if (platform && platform !== "ios" && platform !== "android") {
			this.$errors.fail(
				`ns compiled report takes ios or android, not ${args[0]}.`,
			);
		}
		this.$projectData.initializeProjectData();
		const draft = this.readDraft(platform);
		const report = await this.$compiledReportService.createReport(
			this.$projectData,
			draft,
		);
		const body = this.$compiledReportService.formatBody(report, false);
		const { url, truncated } = newIssueUrl(report.title, body, report.labels);

		this.printReport(report, body);
		if (report.code) {
			this.$logger.info(
				`The code at ${report.location.file}:${report.location.line} is not in the report; you would be asked separately before it is added.`,
			);
		}
		if (this.$options.dryRun || !isInteractive()) {
			this.$logger.info(
				`\nNew issue URL${truncated ? " (body cut to fit)" : ""}:\n${url}`,
			);
			this.$logger.info(
				this.$options.dryRun
					? "Dry run: nothing was sent."
					: "Nothing was sent: run 'ns compiled report' in a terminal to send it, or open the URL above.",
			);
			return;
		}

		if (
			!this.$options.yes &&
			!(await this.$prompter.confirm(
				`Search github.com/${ISSUES_REPO} for this signature and, if it is new, file it?`,
				() => false,
			))
		) {
			this.$logger.info("Nothing was sent.");
			return;
		}

		const useGh = await this.$compiledReportService.hasGh();
		const found = await this.$compiledReportService.findIssues(
			report.signature,
			useGh,
		);
		if (found === null) {
			this.$logger.warn(
				"Could not search GitHub for existing issues (offline?).",
			);
		}
		if (found?.length) {
			await this.handleExisting(report, found, useGh);
			return;
		}

		await this.fileNew(report, useGh);
	}

	private readDraft(platform: string | undefined): ICompiledReportDraft {
		const errorSource = this.$options.error;
		if (errorSource !== undefined) {
			if (!platform) {
				this.$errors.fail(
					"Name the platform the error came from: ns compiled report ios|android --error <file>.",
				);
			}
			const output =
				errorSource === "-"
					? fs.readFileSync(0, "utf8")
					: this.$fs.exists(errorSource)
						? this.$fs.readText(errorSource)
						: null;
			if (output === null) {
				this.$errors.fail(`No file ${errorSource}.`);
			}
			return {
				kind: "runtime",
				platform,
				createdAt: new Date().toISOString(),
				output,
			};
		}

		const draft = this.$compiledReportService.loadDraft(
			this.$projectData,
			platform,
		);
		if (!draft) {
			this.$errors.fail(
				`No failed --compiled build${platform ? ` for ${platform}` : ""} to report. ` +
					"Build with --compiled first, or pass a runtime error with --error <file>.",
			);
		}

		return draft;
	}

	private printReport(report: ICompiledReport, body: string): void {
		this.$logger.info(
			[
				`Title:  ${report.title}`,
				`Labels: ${report.labels.join(", ")}`,
				"----- body -----",
				body,
				"----------------",
			].join("\n"),
		);
	}

	private async handleExisting(
		report: ICompiledReport,
		found: IReportedIssue[],
		useGh: boolean,
	): Promise<void> {
		this.$logger.info(
			`Already reported:\n${found.map((issue) => `  #${issue.number} (${issue.state.toLowerCase()}) ${issue.title}\n  ${issue.url}`).join("\n")}`,
		);
		const issue =
			found.find((i) => i.state.toLowerCase() === "open") ?? found[0];
		const comment = `Add a +1 comment to #${issue.number} with this environment (no code)`;
		const open = `Open #${issue.number} in the browser`;
		const choice = await this.$prompter.promptForChoice("What next?", [
			...(useGh ? [comment] : []),
			open,
			"Nothing",
		]);
		if (
			choice === comment &&
			(await this.$compiledReportService.commentOnIssue(
				this.$projectData,
				report,
				issue,
			))
		) {
			this.$logger.info(`Added a +1 to ${issue.url}. Thank you.`);
		} else if (choice === open) {
			this.$opener.open(issue.url);
		}
	}

	private async fileNew(
		report: ICompiledReport,
		useGh: boolean,
	): Promise<void> {
		let includeCode = false;
		if (report.code) {
			this.$logger.info(`\n${report.location.file}:\n${report.code}`);
			includeCode = await this.$prompter.confirm(
				`Include these lines of ${report.location.file} in the public issue?`,
				() => false,
			);
		}
		const body = this.$compiledReportService.formatBody(report, includeCode);
		const created = useGh
			? await this.$compiledReportService.createIssue(
					this.$projectData,
					report,
					body,
				)
			: null;
		if (created) {
			this.$logger.info(`Filed ${created}. Thank you.`);
			return;
		}

		const { url, truncated } = newIssueUrl(report.title, body, report.labels);
		this.$logger.info(`Opening a prefilled issue in the browser:\n${url}`);
		if (truncated) {
			this.$logger.warn(
				`The body was cut to fit the URL; paste the rest from ${this.writeFullBody(report, body)}.`,
			);
		}
		this.$opener.open(url);
	}

	private writeFullBody(report: ICompiledReport, body: string): string {
		const file = `${this.$compiledReportService.getReportDir(this.$projectData, report.platform)}/report.md`;
		this.$fs.writeFile(file, body);
		return file;
	}
}

injector.registerCommand("compiled|report", CompiledReportCommand);
