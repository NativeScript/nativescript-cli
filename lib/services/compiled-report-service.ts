import * as crypto from "crypto";
import * as os from "os";
import * as path from "path";
import { resolvePackagePath } from "@rigor789/resolve-package-path";
import { COMPILER_PACKAGE_NAME } from "../constants";
import {
	IChildProcess,
	IFileSystem,
	ISysInfo,
	Server,
} from "../common/declarations";
import { IProjectData } from "../definitions/project";
import { injector } from "../common/yok";

export type CompiledReportKind =
	"compile-refused" | "native-compile" | "runtime";

export const ISSUES_REPO = "NativeScript/NativeScript";
// GitHub answers longer issues/new URLs with 414.
const MAX_URL_LENGTH = 8000;
const SEARCH_TIMEOUT_MS = 5000;
const MAX_DRAFT_OUTPUT = 200 * 1024;
const MAX_DIAGNOSTICS = 10;

export interface ICompiledReportDraft {
	kind: CompiledReportKind;
	platform: string;
	createdAt: string;
	output: string;
}

export interface ICompiledDiagnostic {
	location?: string;
	message: string;
	/** The source text the compiler quotes after a refusal: code, so it is shared only with consent. */
	snippet?: string;
}

export interface ICompiledReport {
	kind: CompiledReportKind;
	platform: string;
	signature: string;
	title: string;
	labels: string[];
	environment: [string, string][];
	plugins: [string, string][];
	diagnostics: ICompiledDiagnostic[];
	location?: { file: string; line: number };
	/** The location's line and three either side, numbered; shared only with consent. */
	code?: string;
}

export interface IReportedIssue {
	number: number;
	title: string;
	state: string;
	url: string;
}

const KIND_DESCRIPTIONS: Record<CompiledReportKind, string> = {
	"compile-refused": "The compiler refused a construct in the app",
	"native-compile": "The generated Swift or Kotlin did not compile",
	runtime: "A compiled app failed at runtime",
};

const FRAMEWORKS: { name: string; markers: string[]; versionOf: string }[] = [
	{
		name: "angular",
		markers: ["@nativescript/angular"],
		versionOf: "@angular/core",
	},
	{ name: "vue", markers: ["nativescript-vue"], versionOf: "nativescript-vue" },
	{
		name: "svelte",
		markers: ["@nativescript-community/svelte-native", "svelte-native"],
		versionOf: "svelte",
	},
	{ name: "react", markers: ["react-nativescript"], versionOf: "react" },
	{
		name: "solid",
		markers: ["@nativescript-community/solid-js", "dominative"],
		versionOf: "solid-js",
	},
];

const SOURCE_EXTENSIONS = "ts|tsx|js|jsx|mjs|vue|svelte|xml|html|css|scss";
const SOURCE_REFERENCE = new RegExp(
	`((?:file://)?[^\\s()'"\`]+\\.(?:${SOURCE_EXTENSIONS})):(\\d+)(?::\\d+)?`,
);
const LOCATED_LINE =
	/^(?:e: |error: )?(?:file:\/\/)?(\S+?:\d+(?::\d+)?):? (?:error: )?(.+)$/;
const REFUSAL = /^(.* is not supported in a release build(?: yet)?): (.+)$/;

const SECRETS: [RegExp, string][] = [
	[
		/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
		"<private key>",
	],
	[/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/g, "<token>"],
	[/\bAKIA[0-9A-Z]{16}\b/g, "<token>"],
	[/\bAIza[0-9A-Za-z_-]{35}\b/g, "<token>"],
	[/\bxox[abprs]-[A-Za-z0-9-]{10,}/g, "<token>"],
	[/\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/g, "<token>"],
	[/\bsk-[A-Za-z0-9_-]{20,}/g, "<token>"],
	[/\beyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}/g, "<token>"],
	[/(\/\/[^\s:/@]+:)[^\s@/]+@/g, "$1<redacted>@"],
	[
		/\b((?:password|passwd|secret|token|api[_-]?key|access[_-]?key|private[_-]?key|auth)[\w.-]*["']?\s*[=:]\s*)(["']?)[^\s"',;]+\2/gi,
		"$1<redacted>",
	],
];

const stripAnsi = (text: string) => text.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");

/** Paths made relative to the project, the home folder and user names hidden, and secrets removed. */
export function redact(
	text: string,
	projectDir: string,
	homeDir = os.homedir(),
): string {
	let result = text;
	for (const dir of [projectDir, homeDir]) {
		if (!dir) {
			continue;
		}
		const replacement = dir === projectDir ? "" : "~/";
		result = result
			.split(`file://${dir}/`)
			.join(replacement)
			.split(`${dir}/`)
			.join(replacement)
			.split(dir)
			.join(dir === projectDir ? "." : "~");
	}
	result = result
		.replace(/(\/(?:Users|home))\/[^/\s]+/g, "$1/<user>")
		.replace(/([A-Za-z]:\\Users)\\[^\\\s]+/g, "$1\\<user>");
	for (const [pattern, replacement] of SECRETS) {
		result = result.replace(pattern, replacement);
	}

	return result;
}

/** The message with what varies between apps abstracted: quoted text, paths, numbers and the app's identifiers. */
export function abstractMessage(message: string): string {
	return message
		.replace(/(['"`‘“])(?:(?!\1).)*?(['"`’”])/g, "<q>")
		.replace(/(?:[\w.~-]*\/)+[\w.-]+/g, "<path>")
		.replace(/\b\d+(?:\.\d+)*\b/g, "<n>")
		.replace(/[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+/g, "<id>")
		.replace(/\b[a-z_$][\w$]*(?:[A-Z_$]|\d)[\w$]*\b/g, "<id>")
		.replace(/\s+/g, " ")
		.trim();
}

/** What kind of construct a message names: an API (`Utils.ios`, `Array.prototype.slice`) or an error class, kept as is. */
export function constructOf(message: string): string {
	const what = message
		.split(/ is not supported| does not | cannot |: /)[0]
		.trim();
	return /^[A-Z][\w$]*(?:\.[\w$]+)*$/.test(what) ? what : "";
}

export function computeSignature(
	kind: CompiledReportKind,
	message: string,
): string {
	return crypto
		.createHash("sha256")
		.update(`${kind}\n${abstractMessage(message)}\n${constructOf(message)}`)
		.digest("hex")
		.slice(0, 6);
}

function parseDiagnostic(line: string): ICompiledDiagnostic {
	const located = LOCATED_LINE.exec(line);
	const message = located ? located[2] : line;
	const refusal = REFUSAL.exec(message);
	return {
		location: located?.[1],
		message: refusal ? refusal[1] : message,
		snippet: refusal?.[2],
	};
}

/** The lines of a failed build's output, or of a pasted runtime error, that say what went wrong. */
export function extractDiagnostics(
	kind: CompiledReportKind,
	output: string,
): string[] {
	const lines = stripAnsi(output)
		.split(/\r?\n/)
		.map((line) => line.trimEnd())
		.filter((line) => line.trim());
	const isStackLine = (line: string) => /^\s+at /.test(line);
	let found: string[];
	if (kind === "runtime") {
		const start = lines.findIndex((line) =>
			/\b(?:[A-Z]\w*(?:Error|Exception)|Fatal error|Uncaught)\b/.test(line),
		);
		found =
			start === -1
				? lines.slice(0, 15)
				: [
						lines[start].replace(
							/^.*?(?=(?:Uncaught )?\b[A-Z][\w.]*(?:Error|Exception)\b|Fatal error)/,
							"",
						),
						...lines.slice(start + 1, start + 15),
					];
	} else if (kind === "compile-refused") {
		found = lines.filter(
			(line) =>
				/^\S+:\d+(?::\d+)?: /.test(line) ||
				/is not supported in a release build|does not apply/.test(line),
		);
		if (!found.length) {
			const start = lines.findIndex((line) => /^\w*Error: /.test(line));
			found =
				start === -1
					? lines.slice(-5)
					: lines
							.slice(start)
							.filter(
								(line) => !isStackLine(line) && !/^Node\.js v/.test(line),
							);
		}
		// Without --all-errors the compiler throws its first refusal, which Node prints after "Error: ".
		found = found.map((line) => line.replace(/^Error: /, ""));
	} else {
		found = lines.filter((line) => /: error: |^e: |^error: /.test(line));
		if (!found.length) {
			const wrong = lines.findIndex((line) => /What went wrong:/.test(line));
			found =
				wrong !== -1 ? lines.slice(wrong + 1, wrong + 4) : lines.slice(-10);
		}
	}

	return [...new Set(found.map((line) => line.trim()))].slice(
		0,
		MAX_DIAGNOSTICS,
	);
}

export function newIssueUrl(
	title: string,
	body: string,
	labels: string[],
): { url: string; truncated: boolean } {
	const base =
		`https://github.com/${ISSUES_REPO}/issues/new?title=${encodeURIComponent(title)}` +
		`&labels=${encodeURIComponent(labels.join(","))}&body=`;
	const note = "\n\n_(The report was cut to fit a URL.)_";
	let text = body;
	let truncated = false;
	while ((base + encodeURIComponent(text)).length > MAX_URL_LENGTH) {
		const lines = text.split("\n");
		truncated = true;
		text = lines
			.slice(0, Math.max(1, Math.floor(lines.length * 0.9)))
			.join("\n");
		if (lines.length === 1) {
			text = text.slice(0, Math.floor(text.length * 0.9));
		}
		if ((base + encodeURIComponent(text + note)).length <= MAX_URL_LENGTH) {
			text += note;
			break;
		}
	}

	return { url: base + encodeURIComponent(text), truncated };
}

/**
 * `ns compiled report`'s data: the draft a failed `--compiled` build leaves,
 * the report made from it (environment, diagnostic, signature), and the
 * GitHub side (finding an issue with the same signature, filing or +1-ing one).
 */
export class CompiledReportService {
	constructor(
		private $childProcess: IChildProcess,
		private $fs: IFileSystem,
		private $httpClient: Server.IHttpClient,
		private $logger: ILogger,
		private $staticConfig: Config.IStaticConfig,
		private $sysInfo: ISysInfo,
	) {}

	public getReportDir(projectData: IProjectData, platform: string): string {
		return path.join(
			projectData.platformsDir,
			"compiled",
			platform.toLowerCase(),
		);
	}

	private getDraftPath(projectData: IProjectData, platform: string): string {
		return path.join(this.getReportDir(projectData, platform), "report.json");
	}

	/** Keeps what a failed build printed for `ns compiled report`, and returns the line that says how to report it. */
	public saveDraft(
		projectData: IProjectData,
		platform: string,
		kind: CompiledReportKind,
		output: string,
	): string {
		const draft: ICompiledReportDraft = {
			kind,
			platform: platform.toLowerCase(),
			createdAt: new Date().toISOString(),
			output: output.slice(-MAX_DRAFT_OUTPUT),
		};
		try {
			this.$fs.writeJson(this.getDraftPath(projectData, platform), draft);
		} catch (err) {
			this.$logger.trace(
				`Saving the compiled report draft failed: ${err.message}`,
			);
			return "";
		}

		return `If this looks like a NativeScript problem, report it with 'ns compiled report ${draft.platform}' (it shows you the report before anything is sent).`;
	}

	public clearDraft(projectData: IProjectData, platform: string): void {
		this.$fs.deleteFile(this.getDraftPath(projectData, platform));
	}

	/** The platform's draft, or without a platform the newest one. */
	public loadDraft(
		projectData: IProjectData,
		platform?: string,
	): ICompiledReportDraft | null {
		const drafts = (platform ? [platform] : ["ios", "android"])
			.map((p) => this.getDraftPath(projectData, p))
			.filter((file) => this.$fs.exists(file))
			.map((file) => <ICompiledReportDraft>this.$fs.readJson(file))
			.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

		return drafts[0] ?? null;
	}

	public async createReport(
		projectData: IProjectData,
		draft: ICompiledReportDraft,
	): Promise<ICompiledReport> {
		const projectDir = projectData.projectDir;
		const clean = (text: string) => redact(text, projectDir);
		const diagnostics = extractDiagnostics(draft.kind, draft.output).map(
			(line) => parseDiagnostic(clean(line)),
		);
		const primary = diagnostics[0]?.message ?? "Unknown failure";
		const signature = computeSignature(draft.kind, primary);
		const framework = this.detectFramework(projectData);
		const headline =
			primary.length > 100 ? `${primary.slice(0, 97)}...` : primary;
		const location = this.findLocation(projectDir, draft.output);

		return {
			kind: draft.kind,
			platform: draft.platform,
			signature,
			title: `[compiled][${draft.platform}] ${headline} (sig ${signature})`,
			labels: [
				"compiled",
				`platform:${draft.platform}`,
				`framework:${framework.name}`,
				`kind:${draft.kind}`,
			],
			environment: await this.collectEnvironment(
				projectData,
				draft.platform,
				framework,
			),
			plugins: this.collectPlugins(projectData),
			diagnostics,
			location,
			code: location && this.readCode(projectDir, location),
		};
	}

	public formatBody(report: ICompiledReport, includeCode: boolean): string {
		const diagnostic = report.diagnostics
			.map((d) =>
				[
					d.location && `${d.location}: `,
					d.message,
					includeCode && d.snippet ? `: ${d.snippet}` : "",
				]
					.filter(Boolean)
					.join(""),
			)
			.join("\n");
		const sections = [
			`<!-- ns compiled report: sig ${report.signature} -->`,
			`### What happened`,
			`${KIND_DESCRIPTIONS[report.kind]} (\`${report.kind}\`, ${report.platform}).`,
			"",
			"~~~",
			diagnostic || "(no diagnostic found in the output)",
			"~~~",
		];
		if (report.location) {
			sections.push(
				"",
				`### Where`,
				`\`${report.location.file}:${report.location.line}\``,
			);
		}
		if (includeCode && report.code) {
			sections.push(
				"",
				"### Code (shared with the reporter's consent)",
				"~~~",
				report.code,
				"~~~",
			);
		}
		sections.push("", "### Environment", this.formatEnvironment(report));
		sections.push(
			"",
			`Signature \`${report.signature}\`: a hash of the kind, the message with names and numbers abstracted, and the construct; issues with the same signature are the same problem.`,
			`Labels: ${report.labels.map((label) => `\`${label}\``).join(", ")}`,
			"",
			"_Filed with `ns compiled report`._",
		);

		return sections.join("\n");
	}

	public formatComment(report: ICompiledReport): string {
		const primary = report.diagnostics[0];
		return [
			`+1 from \`ns compiled report\` (sig ${report.signature}, ${report.platform}).`,
			"",
			primary
				? `~~~\n${primary.location ? `${primary.location}: ` : ""}${primary.message}\n~~~\n`
				: "",
			this.formatEnvironment(report),
		].join("\n");
	}

	private formatEnvironment(report: ICompiledReport): string {
		const rows = report.environment.map(
			([name, value]) => `| ${name} | ${value} |`,
		);
		const plugins = report.plugins.map(
			([name, version]) => `- ${name} ${version}`,
		);
		return [
			"| | |",
			"| --- | --- |",
			...rows,
			"",
			`<details><summary>Dependencies (${plugins.length})</summary>`,
			"",
			...plugins,
			"",
			"</details>",
		].join("\n");
	}

	/** Whether `gh` is installed and signed in to github.com. */
	public async hasGh(): Promise<boolean> {
		const result = await this.gh([
			"auth",
			"status",
			"--hostname",
			"github.com",
		]);
		return result.exitCode === 0;
	}

	/** Open and closed issues whose title has the signature; null when the search could not run. */
	public async findIssues(
		signature: string,
		useGh: boolean,
	): Promise<IReportedIssue[] | null> {
		const query = `"sig ${signature}" in:title`;
		if (useGh) {
			const result = await this.gh([
				"issue",
				"list",
				"--repo",
				ISSUES_REPO,
				"--state",
				"all",
				"--search",
				query,
				"--json",
				"number,title,state,url",
				"--limit",
				"5",
			]);
			if (result.exitCode === 0) {
				try {
					return JSON.parse(result.stdout);
				} catch {
					return null;
				}
			}
		}

		const url = `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${ISSUES_REPO} is:issue ${query}`)}&per_page=5`;
		try {
			const response = await Promise.race([
				this.$httpClient.httpRequest({
					url,
					method: "GET",
					headers: { Accept: "application/vnd.github+json" },
				}),
				new Promise<never>((_, reject) =>
					setTimeout(
						() => reject(new Error("timed out")),
						SEARCH_TIMEOUT_MS,
					).unref(),
				),
			]);
			const items: any[] = JSON.parse(response.body).items ?? [];
			return items.map((item) => ({
				number: item.number,
				title: item.title,
				state: item.state,
				url: item.html_url,
			}));
		} catch (err) {
			this.$logger.trace(
				`Searching GitHub for the report's signature failed: ${err.message}`,
			);
			return null;
		}
	}

	/** Files the issue with `gh`; returns its URL, or null when gh failed. */
	public async createIssue(
		projectData: IProjectData,
		report: ICompiledReport,
		body: string,
	): Promise<string | null> {
		const bodyFile = this.writeBodyFile(
			projectData,
			report.platform,
			"report.md",
			body,
		);
		const args = [
			"issue",
			"create",
			"--repo",
			ISSUES_REPO,
			"--title",
			report.title,
			"--body-file",
			bodyFile,
		];
		let result = await this.gh([
			...args,
			...report.labels.flatMap((label) => ["--label", label]),
		]);
		// A label the repository lacks, or one the reporter may not set, fails the whole create.
		if (result.exitCode !== 0 && /label/i.test(result.stderr)) {
			this.$logger.warn(
				"GitHub refused the labels; filing without them (they are listed in the body).",
			);
			result = await this.gh(args);
		}
		if (result.exitCode !== 0) {
			this.$logger.warn(`gh issue create failed: ${result.stderr.trim()}`);
			return null;
		}

		return result.stdout.trim().split("\n").pop();
	}

	public async commentOnIssue(
		projectData: IProjectData,
		report: ICompiledReport,
		issue: IReportedIssue,
	): Promise<boolean> {
		const bodyFile = this.writeBodyFile(
			projectData,
			report.platform,
			"report-comment.md",
			this.formatComment(report),
		);
		const result = await this.gh([
			"issue",
			"comment",
			String(issue.number),
			"--repo",
			ISSUES_REPO,
			"--body-file",
			bodyFile,
		]);
		if (result.exitCode !== 0) {
			this.$logger.warn(`gh issue comment failed: ${result.stderr.trim()}`);
		}

		return result.exitCode === 0;
	}

	private writeBodyFile(
		projectData: IProjectData,
		platform: string,
		name: string,
		body: string,
	): string {
		const file = path.join(this.getReportDir(projectData, platform), name);
		this.$fs.writeFile(file, body);
		return file;
	}

	private gh(args: string[]) {
		return this.$childProcess.spawnFromEvent(
			"gh",
			args,
			"close",
			{},
			{ throwError: false },
		);
	}

	private findLocation(
		projectDir: string,
		output: string,
	): { file: string; line: number } | undefined {
		for (const line of stripAnsi(output).split(/\r?\n/)) {
			const match = SOURCE_REFERENCE.exec(line);
			if (!match) {
				continue;
			}
			const file = path.resolve(projectDir, match[1].replace(/^file:\/\//, ""));
			const relative = path.relative(projectDir, file);
			if (
				relative.startsWith("..") ||
				path.isAbsolute(relative) ||
				relative.startsWith(`platforms${path.sep}`) ||
				relative.includes(path.join("node_modules", COMPILER_PACKAGE_NAME))
			) {
				continue;
			}
			return {
				file: relative.split(path.sep).join("/"),
				line: Number(match[2]),
			};
		}

		return undefined;
	}

	private readCode(
		projectDir: string,
		location: { file: string; line: number },
	): string | undefined {
		const file = path.join(projectDir, location.file);
		if (!this.$fs.exists(file)) {
			return undefined;
		}
		const lines = this.$fs.readText(file).split(/\r?\n/);
		const first = Math.max(1, location.line - 3);
		const last = Math.min(lines.length, location.line + 3);
		const width = String(last).length;
		const numbered = [];
		for (let n = first; n <= last; n++) {
			numbered.push(
				`${String(n).padStart(width)} ${n === location.line ? ">" : "|"} ${lines[n - 1]}`,
			);
		}

		return redact(numbered.join("\n"), projectDir);
	}

	private readPackageJson(projectDir: string): any {
		const file = path.join(projectDir, "package.json");
		return this.$fs.exists(file) ? this.$fs.readJson(file) : {};
	}

	private installedVersion(
		projectData: IProjectData,
		name: string,
	): string | undefined {
		const pkg = this.readPackageJson(projectData.projectDir);
		try {
			const dir = resolvePackagePath(name, { paths: [projectData.projectDir] });
			if (dir) {
				return this.$fs.readJson(path.join(dir, "package.json")).version;
			}
		} catch (err) {
			this.$logger.trace(`Reading ${name}'s version failed: ${err.message}`);
		}

		return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
	}

	public detectFramework(projectData: IProjectData): {
		name: string;
		version: string;
	} {
		const pkg = this.readPackageJson(projectData.projectDir);
		const deps = { ...pkg.devDependencies, ...pkg.dependencies };
		const framework = FRAMEWORKS.find((f) =>
			f.markers.some((marker) => marker in deps),
		);
		if (!framework) {
			return { name: "xml", version: "" };
		}

		return {
			name: framework.name,
			version:
				this.installedVersion(projectData, framework.versionOf) ?? "unknown",
		};
	}

	private collectPlugins(projectData: IProjectData): [string, string][] {
		const dependencies =
			this.readPackageJson(projectData.projectDir).dependencies ?? {};
		return Object.keys(dependencies)
			.sort()
			.map((name) => [
				name,
				this.installedVersion(projectData, name) ?? "unknown",
			]);
	}

	private async collectEnvironment(
		projectData: IProjectData,
		platform: string,
		framework: { name: string; version: string },
	): Promise<[string, string][]> {
		const version = (name: string) =>
			this.installedVersion(projectData, name) ?? "not installed";
		const rows: [string, string][] = [
			["NativeScript CLI", this.$staticConfig.version],
			[COMPILER_PACKAGE_NAME, version(COMPILER_PACKAGE_NAME)],
			["@nativescript/core", version("@nativescript/core")],
			[
				"Framework",
				`${framework.name}${framework.version ? ` ${framework.version}` : ""}`,
			],
			["Platform", platform],
		];
		if (platform === "ios") {
			let xcode: string;
			try {
				xcode = await this.$sysInfo.getXcodeVersion();
			} catch (err) {
				this.$logger.trace(`Reading Xcode's version failed: ${err.message}`);
			}
			rows.push(["Xcode", xcode || "unknown"]);
		} else {
			rows.push(...this.androidToolVersions(projectData));
		}
		rows.push(
			["OS", `${os.type()} ${os.release()} ${os.arch()}`],
			["Node.js", process.version],
		);

		return rows;
	}

	private androidToolVersions(projectData: IProjectData): [string, string][] {
		let gradle = "unknown";
		try {
			const compilerDir = resolvePackagePath(COMPILER_PACKAGE_NAME, {
				paths: [projectData.projectDir],
			});
			const wrapper =
				compilerDir &&
				path.join(
					compilerDir,
					"kit-android",
					"gradle",
					"wrapper",
					"gradle-wrapper.properties",
				);
			if (wrapper && this.$fs.exists(wrapper)) {
				gradle =
					/gradle-([\d.]+)-/.exec(this.$fs.readText(wrapper))?.[1] ?? gradle;
			}
		} catch (err) {
			this.$logger.trace(`Reading Gradle's version failed: ${err.message}`);
		}

		const projectRoot = this.getReportDir(projectData, "android");
		const scripts = this.$fs.exists(projectRoot)
			? this.$fs
					.readDirectory(projectRoot)
					.filter((file) => /\.gradle(\.kts)?$/.test(file))
					.map((file) => this.$fs.readText(path.join(projectRoot, file)))
					.join("\n")
			: "";
		const plugin = (id: string) =>
			new RegExp(
				`id\\s*\\(?\\s*["']${id.replace(/\./g, "\\.")}["']\\s*\\)?\\s*version\\s*["']([^"']+)`,
			).exec(scripts)?.[1] ?? "unknown";

		return [
			["Gradle", gradle],
			["Android Gradle Plugin", plugin("com.android.application")],
			["Kotlin", plugin("org.jetbrains.kotlin.android")],
		];
	}
}
injector.register("compiledReportService", CompiledReportService);
