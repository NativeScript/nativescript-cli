import { assert } from "chai";
import * as plist from "plist";
import {
	PlistSession,
	Reporter,
} from "../../../lib/tools/plist-merge/plist-session";

const build = (patches: any[], reporter?: Reporter) => {
	const session = new PlistSession(reporter);

	patches.forEach((patch, index) =>
		session.patch({ name: `patch-${index}`, read: () => plist.build(patch) }),
	);

	return session.build();
};

const merge = (patches: any[], reporter?: Reporter): any =>
	plist.parse(build(patches, reporter));

describe("PlistSession", () => {
	it("reports no patches until one is scheduled", () => {
		const session = new PlistSession();
		assert.isFalse(session.hasPatches);

		session.patch({ name: "p", read: () => plist.build({ A: "1" }) });
		assert.isTrue(session.hasPatches);
	});

	it("builds a plist from a single patch", () => {
		assert.deepStrictEqual(merge([{ CFBundleName: "app" }]), {
			CFBundleName: "app",
		});
	});

	it("lets a later patch overwrite a scalar", () => {
		assert.deepStrictEqual(merge([{ A: "1", B: "keep" }, { A: "2" }]), {
			A: "2",
			B: "keep",
		});
	});

	it("merges nested objects rather than replacing them", () => {
		assert.deepStrictEqual(
			merge([{ N: { x: "1", y: "2" } }, { N: { y: "9", z: "3" } }]),
			{ N: { x: "1", y: "9", z: "3" } },
		);
	});

	it("replaces plain arrays instead of concatenating them", () => {
		// lodash would merge these element-wise, which is not what a plist patch means
		assert.deepStrictEqual(merge([{ Arr: ["a", "b", "c"] }, { Arr: ["z"] }]), {
			Arr: ["z"],
		});
	});

	describe("CFBundleURLTypes", () => {
		it("folds schemes into an entry that declares the same role", () => {
			const result = merge([
				{
					CFBundleURLTypes: [
						{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["a"] },
					],
				},
				{
					CFBundleURLTypes: [
						{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["b"] },
					],
				},
			]);

			assert.deepStrictEqual(result.CFBundleURLTypes, [
				{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["a", "b"] },
			]);
		});

		it("appends an entry declaring a different role", () => {
			const result = merge([
				{
					CFBundleURLTypes: [
						{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["a"] },
					],
				},
				{
					CFBundleURLTypes: [
						{ CFBundleTypeRole: "Viewer", CFBundleURLSchemes: ["b"] },
					],
				},
			]);

			assert.deepStrictEqual(result.CFBundleURLTypes, [
				{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["a"] },
				{ CFBundleTypeRole: "Viewer", CFBundleURLSchemes: ["b"] },
			]);
		});

		it("accumulates schemes across three patches", () => {
			const patchFor = (scheme: string) => ({
				CFBundleURLTypes: [
					{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: [scheme] },
				],
			});

			const result = merge([patchFor("a"), patchFor("b"), patchFor("c")]);

			assert.deepStrictEqual(result.CFBundleURLTypes, [
				{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["a", "b", "c"] },
			]);
		});

		it("warns when an entry omits the role it would be matched on", () => {
			const warnings: string[] = [];
			const result = merge(
				[
					{ CFBundleURLTypes: [{ CFBundleURLSchemes: ["a"] }] },
					{
						CFBundleURLTypes: [
							{ CFBundleTypeRole: "Editor", CFBundleURLSchemes: ["b"] },
						],
					},
				],
				{ warn: (msg: string) => warnings.push(msg) },
			);

			assert.lengthOf(warnings, 1);
			assert.include(warnings[0], "CFBundleTypeRole is required");
			// the roles do not match, so the patch is appended rather than folded in
			assert.lengthOf(result.CFBundleURLTypes, 2);
		});
	});

	describe("LSApplicationQueriesSchemes", () => {
		it("unions schemes and drops duplicates", () => {
			const result = merge([
				{ LSApplicationQueriesSchemes: ["a", "b"] },
				{ LSApplicationQueriesSchemes: ["b", "c"] },
			]);

			assert.deepStrictEqual(result.LSApplicationQueriesSchemes, [
				"a",
				"b",
				"c",
			]);
		});
	});

	it("reports progress through the reporter", () => {
		const messages: string[] = [];
		build([{ A: "1" }], { log: (msg: string) => messages.push(msg) });

		assert.include(messages, "Start");
		assert.include(messages, "Complete");
		assert.include(messages, "Patch 'patch-0'");
	});

	it("works without a reporter", () => {
		assert.deepStrictEqual(merge([{ A: "1" }]), { A: "1" });
	});
});
