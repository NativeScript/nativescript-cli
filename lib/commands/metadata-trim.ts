import * as path from "path";
import {
	arrayOption,
	Command,
	CommandOptionsSchema,
	stringOption,
} from "../common/define-command";
import { inject } from "../common/di";
import { IMetadataTrimService } from "../definitions/metadata-trim-service";

const PLATFORMS = ["ios", "macos", "android"];

const metadataTrimOptions = {
	out: stringOption(),
	keep: arrayOption(),
	analyzer: stringOption(),
	generator: stringOption(),
	framework: stringOption(),
	androidProject: stringOption(),
	sdk: stringOption(),
	arch: stringOption(),
	minVersion: stringOption(),
} satisfies CommandOptionsSchema;

function formatBytes(bytes: number): string {
	return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function resolved(value: string | undefined): string | undefined {
	return value ? path.resolve(value) : undefined;
}

export class MetadataTrimCommand extends Command({
	name: "metadata|trim",
	description: "Reduces native API metadata to what an app's JavaScript uses.",
	options: metadataTrimOptions,
	params: "any",
}) {
	private $logger = inject<ILogger>("logger");
	private $metadataTrimService = inject<IMetadataTrimService>(
		"metadataTrimService",
	);

	public canExecute(): boolean {
		const [platform, ...bundles] = this.args;
		if (!platform || !PLATFORMS.includes(platform.toLowerCase())) {
			this.context.fail(`Specify a platform: ${PLATFORMS.join(", ")}.`);
		}
		if (!bundles.length) {
			this.context.fail(
				"Specify at least one emitted JavaScript bundle or directory.",
			);
		}
		return true;
	}

	public async run(): Promise<void> {
		const [platform, ...bundles] = this.args;
		const options = this.options;
		const result = await this.$metadataTrimService.trim({
			platform: platform.toLowerCase(),
			bundles: bundles.map((bundle) => path.resolve(bundle)),
			outDir: path.resolve(options.out ?? "metadata-trim"),
			keep: options.keep ?? [],
			analyzerPath: resolved(options.analyzer),
			generatorPath: resolved(options.generator),
			framework: resolved(options.framework),
			androidProject: resolved(options.androidProject),
			sdk: options.sdk,
			arch: options.arch,
			minVersion: options.minVersion,
		});

		if (result.metadataBytes !== undefined) {
			this.$logger.info(
				`Generated ${formatBytes(result.metadataBytes)} of metadata: ${result.metadataPath}`,
			);
		}
		if (result.installedTo) {
			const saved = result.replacedBytes
				? ` (${formatBytes(result.replacedBytes)} smaller)`
				: "";
			this.$logger.info(`Installed to ${result.installedTo}${saved}`);
		}
		if (result.nextStep) {
			this.$logger.info(result.nextStep);
		}
	}
}
