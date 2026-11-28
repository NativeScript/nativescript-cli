/**
 * Keeps the host project's `-sectcreate __DATA __TNSMetadata` linker flag in a
 * sane state when a project is prepared for embedding.
 *
 * `ns embed ios` forces a prepare on every run, and `addToOtherLinkerFlags`
 * appends unconditionally — so every run added another copy of the directive,
 * and `ld` concatenates the referenced files, growing the host executable by a
 * full metadata copy (roughly 9–12 MB) per run. The runtime only reads from the
 * start of the section, which is why the extra copies went unnoticed.
 *
 * The flag therefore has to be set, not appended: drop every existing metadata
 * directive (stale ones naming another architecture or path, plus duplicates
 * left by earlier runs), keep all other linker flags intact, and append the
 * wanted directive once.
 */

/**
 * A metadata directive and its path. The path is either quoted — optionally
 * carrying the JSON escaping an `OTHER_LDFLAGS` array entry has, i.e. `\"p\"` —
 * or unquoted with no spaces.
 */
const METADATA_DIRECTIVE =
	/-sectcreate\s+__DATA\s+__TNSMetadata\s+(?:\\"(?:[^"\\]|\\[\s\S])*?\\"|"(?:[^"\\]|\\[\s\S])*?"|[^\s"\\]+)/g;

const INHERITED = "$(inherited)";

/** The flag value as `nativescript-dev-xcode` stores it: one JSON-quoted string. */
export function metadataSectionFlag(metadataFilePath: string): string {
	return JSON.stringify(
		`-sectcreate __DATA __TNSMetadata "${metadataFilePath}"`,
	);
}

/**
 * Removes metadata directives from a single `OTHER_LDFLAGS` entry.
 *
 * Only the directive goes away: a scalar entry can hold several flags at once
 * (`"$(inherited)" -ObjC`), so its other flags — and the quote that closes the
 * entry — have to survive. Entries without a directive are returned untouched,
 * so unrelated spacing is never rewritten.
 */
function stripMetadataDirectives(entry: string): string {
	const without = entry.replace(METADATA_DIRECTIVE, " ");
	if (without === entry) {
		return entry;
	}

	return without.replace(/[ \t]{2,}/g, " ").trim();
}

/** True when an entry held nothing but the directive once it was removed. */
function isEmptyEntry(entry: string): boolean {
	return /^[\s"']*$/.test(entry);
}

/**
 * Rewrites the build configurations of `project`'s product so `OTHER_LDFLAGS`
 * ends up with exactly one metadata directive.
 *
 * Configurations are selected the same way `addToOtherLinkerFlags` selects them
 * (by the project's `PRODUCT_NAME`), so other targets in the host project keep
 * their own linker flags.
 */
export function setMetadataSectionFlag(project: any, flag: string): void {
	const configurations = project.pbxXCBuildConfigurationSection() || {};
	const productName = project.productName;

	for (const key of Object.keys(configurations)) {
		if (/_comment$/.test(key)) {
			continue;
		}

		const buildSettings = configurations[key].buildSettings;
		if (!buildSettings) {
			continue;
		}

		const currentProductName = buildSettings.PRODUCT_NAME;
		const unquotedProductName =
			typeof currentProductName === "string"
				? currentProductName.replace(/^"(.*)"$/, "$1")
				: currentProductName;
		if (unquotedProductName !== productName) {
			continue;
		}

		const current = buildSettings.OTHER_LDFLAGS;
		const entries: any[] = Array.isArray(current)
			? current
			: current === undefined
				? []
				: [current];

		const kept: any[] = [];
		for (const entry of entries) {
			if (typeof entry !== "string") {
				kept.push(entry);
				continue;
			}

			const stripped = stripMetadataDirectives(entry);
			if (!isEmptyEntry(stripped)) {
				kept.push(stripped);
			}
		}

		// The host's flags are usually inherited from an xcconfig file, so
		// `$(inherited)` has to stay in the list; `addToOtherLinkerFlags` seeds it
		// the same way whenever the setting is missing.
		const hasInherited = kept.some(
			(entry) => typeof entry === "string" && entry.includes(INHERITED),
		);
		if (!hasInherited) {
			kept.unshift(JSON.stringify(INHERITED));
		}

		kept.push(flag);
		buildSettings.OTHER_LDFLAGS = kept;
	}
}
