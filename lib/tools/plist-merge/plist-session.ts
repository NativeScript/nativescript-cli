// Inlined from the plist-merge-patch package (NativeScript, Apache-2.0), which
// was unmaintained and pinned older copies of plist and lodash than the CLI
// already depends on.
import * as plist from "plist";
import * as _ from "lodash";

export interface Reporter {
	log?(msg: string): void;
	warn?(msg: string): void;
}

export interface Patch {
	name: string;
	read(): string;
}

export interface ICFBundleURLType {
	CFBundleTypeRole: string;
	CFBundleURLSchemes: string[];
}

const CF_BUNDLE_URL_TYPES = "CFBundleURLTypes";
const LS_APPLICATION_QUERIES_SCHEMES = "LSApplicationQueriesSchemes";

export class PlistMerger {
	constructor(private reporter?: Reporter) {}

	public merge(base: any, patch: any): any {
		const baseClone = _.cloneDeep(base);
		_.mergeWith(baseClone, patch, this.customizer.bind(this));

		return baseClone;
	}

	/**
	 * Entries declaring the same role are folded into one, so an app and its
	 * plugins can each contribute schemes to a role without displacing each
	 * other. Roles not already present are appended.
	 */
	private mergeCFBundleURLTypes(
		baseValue: ICFBundleURLType[],
		patchValue: ICFBundleURLType[],
	): ICFBundleURLType[] {
		for (const patchElement of patchValue) {
			let shouldAddToBase = true;

			for (const baseElement of baseValue) {
				if (!patchElement.CFBundleTypeRole || !baseElement.CFBundleTypeRole) {
					this.warn(
						`Merging ${CF_BUNDLE_URL_TYPES}: Property CFBundleTypeRole is required!`,
					);
				}

				if (patchElement.CFBundleTypeRole === baseElement.CFBundleTypeRole) {
					baseElement.CFBundleURLSchemes =
						baseElement.CFBundleURLSchemes.concat(
							patchElement.CFBundleURLSchemes,
						);
					shouldAddToBase = false;
				}
			}

			if (shouldAddToBase) {
				baseValue.push(patchElement);
			}
		}

		return baseValue;
	}

	private mergeLSApplicationQueriesSchemes(
		baseValue: string[],
		patchValue: string[],
	): string[] {
		for (const patchElement of patchValue) {
			if (!baseValue.some((x) => x === patchElement)) {
				baseValue.push(patchElement);
			}
		}

		return baseValue;
	}

	private customizer(baseValue: any, patchValue: any, key: string): any {
		if (key === CF_BUNDLE_URL_TYPES && !!baseValue) {
			return this.mergeCFBundleURLTypes(baseValue, patchValue);
		} else if (key === LS_APPLICATION_QUERIES_SCHEMES && !!baseValue) {
			return this.mergeLSApplicationQueriesSchemes(baseValue, patchValue);
		}

		// every other array is replaced rather than concatenated, which is what
		// lodash would otherwise do for two arrays
		if (_.isArray(baseValue)) {
			return patchValue;
		}
	}

	private warn(msg: string): void {
		if (this.reporter && this.reporter.warn) {
			this.reporter.warn(msg);
		}
	}
}

export class PlistSession {
	private patches: Patch[] = [];

	constructor(private reporter?: Reporter) {}

	public get hasPatches(): boolean {
		return this.patches.length > 0;
	}

	public patch(patch: Patch): void {
		this.patches.push(patch);
	}

	public build(): string {
		this.log(`Start`);

		const plistMerger = new PlistMerger(this.reporter);
		let jsonPlist: any = {};

		for (const patch of this.patches) {
			this.log(`Patch '${patch.name}'`);
			const patchJson = plist.parse(patch.read());
			jsonPlist = plistMerger.merge(jsonPlist, patchJson);
		}

		const resultString = plist.build(jsonPlist);
		this.log(`Complete`);

		return resultString;
	}

	private log(msg: string): void {
		if (this.reporter && this.reporter.log) {
			this.reporter.log(msg);
		}
	}
}
