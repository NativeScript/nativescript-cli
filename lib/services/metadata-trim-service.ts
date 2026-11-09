import * as fs from "fs";
import * as path from "path";
import { IChildProcess, IErrors } from "../common/declarations";
import { injector } from "../common/yok";
import {
	IMetadataToolchain,
	IMetadataTrimOptions,
	IMetadataTrimResult,
	IMetadataTrimService,
} from "../definitions/metadata-trim-service";
import { AndroidMetadataToolchain } from "./metadata-trim/android-toolchain";
import { AppleMetadataToolchain } from "./metadata-trim/apple-toolchain";

export class MetadataTrimService implements IMetadataTrimService {
	private toolchains: IMetadataToolchain[];

	constructor(
		$childProcess: IChildProcess,
		private $errors: IErrors,
		private $logger: ILogger,
	) {
		this.toolchains = [
			new AppleMetadataToolchain($childProcess),
			new AndroidMetadataToolchain($childProcess),
		];
	}

	public async trim(
		options: IMetadataTrimOptions,
	): Promise<IMetadataTrimResult> {
		const toolchain = this.toolchains.find((candidate) =>
			candidate.platforms.includes(options.platform),
		);
		if (!toolchain) {
			this.$errors.fail(
				`Metadata trimming is not available for ${options.platform}.`,
			);
		}
		for (const bundle of options.bundles) {
			if (!fs.existsSync(bundle)) {
				this.$errors.fail(`Cannot find the bundle ${bundle}.`);
			}
		}
		fs.mkdirSync(path.resolve(options.outDir), { recursive: true });

		try {
			const usage = await toolchain.analyze(options);
			if (usage.unrestricted) {
				this.$errors.fail(
					"Could not determine which native APIs this app uses, usually because the bundle reads globals dynamically (for example an alias of globalThis, or eval). Nothing was trimmed.",
				);
			}
			this.$logger.info(`Found ${usage.patternCount} native API patterns.`);
			const generated = await toolchain.generate(usage, options);
			const installed = await toolchain.install(
				usage,
				generated.metadataPath,
				options,
			);
			return { usage, ...generated, ...installed };
		} catch (err) {
			this.$errors.fail((err as Error).message);
		}
	}
}

injector.register("metadataTrimService", MetadataTrimService);
