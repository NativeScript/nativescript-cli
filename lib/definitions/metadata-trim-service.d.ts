/** What `ns metadata trim` was asked to do. */
export interface IMetadataTrimOptions {
	platform: string;
	/** Emitted JavaScript (files or directories) the app actually runs. */
	bundles: string[];
	outDir: string;
	/** Filter patterns (`Module:Symbol`) to keep regardless of what is found. */
	keep: string[];
	/** Filter patterns to remove even if the app references them. */
	blacklist?: string[];
	analyzerPath?: string;
	generatorPath?: string;
	/** A NativeScript.framework to embed the trimmed metadata into. */
	framework?: string;
	/** An Android project root, the directory that owns `whitelist.mdg`. */
	androidProject?: string;
	sdk?: string;
	arch?: string;
	minVersion?: string;
}

/** What native-api-usage.json files declare, as filter patterns. */
export interface IDeclaredMetadataRules {
	keep: string[];
	blacklist: string[];
}

/** The native symbols an app's JavaScript can reach. */
export interface IMetadataUsage {
	whitelistPath: string;
	patternCount: number;
	/** The analysis could not bound the app's usage, so nothing can be removed. */
	unrestricted: boolean;
}

export interface IMetadataTrimResult {
	usage: IMetadataUsage;
	/** Set when metadata was generated here rather than by a later build step. */
	metadataPath?: string;
	metadataBytes?: number;
	/** Where the result was installed, when an install target was given. */
	installedTo?: string;
	replacedBytes?: number;
	/** What the caller still has to do for the result to take effect. */
	nextStep?: string;
}

/**
 * One platform's way of turning usage into metadata. Everything host-specific
 * lives behind this interface or in the options, so a new embedder of
 * NativeScript needs an install target rather than a new pipeline.
 */
export interface IMetadataToolchain {
	readonly platforms: string[];
	analyze(options: IMetadataTrimOptions): Promise<IMetadataUsage>;
	generate(
		usage: IMetadataUsage,
		options: IMetadataTrimOptions,
	): Promise<Pick<IMetadataTrimResult, "metadataPath" | "metadataBytes">>;
	install(
		usage: IMetadataUsage,
		metadataPath: string | undefined,
		options: IMetadataTrimOptions,
	): Promise<
		Pick<IMetadataTrimResult, "installedTo" | "replacedBytes" | "nextStep">
	>;
}

export interface IMetadataTrimService {
	trim(options: IMetadataTrimOptions): Promise<IMetadataTrimResult>;
}
