import { IProjectData } from "../../definitions/project";

/**
 * Identifies a debug manifest whose cleartext permission the CLI wrote, so a
 * later prepare that doesn't need it can take it out again.
 */
export const DEV_CLEARTEXT_MARKER =
	"nativescript-cli: cleartext HTTP to the Vite dev server (debug HMR runs only)";

const TOOLS_NS = 'xmlns:tools="http://schemas.android.com/tools"';
const CLEARTEXT_ATTRIBUTE = "android:usesCleartextTraffic";

/**
 * A Vite HMR app loads its code from the dev server over plain HTTP, which
 * Android blocks by default from API 28.
 */
export function needsDevCleartext(
	projectData: Pick<IProjectData, "bundler">,
	prepareData: { hmr?: boolean; release?: boolean },
): boolean {
	return (
		projectData.bundler === "vite" && !!prepareData.hmr && !prepareData.release
	);
}

export function hasDevCleartext(manifest: string | null): boolean {
	return !!manifest && manifest.includes(DEV_CLEARTEXT_MARKER);
}

/** The debug source set's manifest when the app ships none of its own. */
export function devCleartextManifest(): string {
	return [
		'<?xml version="1.0" encoding="utf-8"?>',
		`<!-- ${DEV_CLEARTEXT_MARKER} -->`,
		`<manifest xmlns:android="http://schemas.android.com/apk/res/android" ${TOOLS_NS}>`,
		`\t<application ${CLEARTEXT_ATTRIBUTE}="true" tools:replace="${CLEARTEXT_ATTRIBUTE}" />`,
		"</manifest>",
		"",
	].join("\n");
}

/**
 * The app's own debug manifest with the permission added. `tools:replace`
 * lets it win over a main manifest that sets the attribute itself.
 */
export function withDevCleartext(manifest: string): string {
	let result = manifest;
	const manifestTag = /<manifest\b[^>]*>/.exec(result);
	if (!manifestTag) {
		return result;
	}
	if (!manifestTag[0].includes("xmlns:tools=")) {
		const withTools = manifestTag[0].replace(
			/^<manifest\b/,
			`<manifest ${TOOLS_NS}`,
		);
		result = result.replace(manifestTag[0], withTools);
	}

	const applicationTag = /<application\b[^>]*?(\/?)>/.exec(result);
	if (!applicationTag) {
		result = result.replace(
			/<\/manifest>/,
			`\t<application ${CLEARTEXT_ATTRIBUTE}="true" tools:replace="${CLEARTEXT_ATTRIBUTE}" />\n</manifest>`,
		);
	} else {
		let tag = applicationTag[0];
		const value = new RegExp(`${CLEARTEXT_ATTRIBUTE}\\s*=\\s*"[^"]*"`);
		tag = value.test(tag)
			? tag.replace(value, `${CLEARTEXT_ATTRIBUTE}="true"`)
			: tag.replace(
					/^<application\b/,
					`<application ${CLEARTEXT_ATTRIBUTE}="true"`,
				);
		const replace = /tools:replace\s*=\s*"([^"]*)"/.exec(tag);
		if (!replace) {
			tag = tag.replace(
				/^<application\b/,
				`<application tools:replace="${CLEARTEXT_ATTRIBUTE}"`,
			);
		} else if (
			!replace[1]
				.split(",")
				.map((name) => name.trim())
				.includes(CLEARTEXT_ATTRIBUTE)
		) {
			tag = tag.replace(
				replace[0],
				`tools:replace="${replace[1]},${CLEARTEXT_ATTRIBUTE}"`,
			);
		}
		result = result.replace(applicationTag[0], tag);
	}

	return result.replace(
		/(<manifest\b)/,
		`<!-- ${DEV_CLEARTEXT_MARKER} -->\n$1`,
	);
}
