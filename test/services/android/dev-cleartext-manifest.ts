import { assert } from "chai";
import {
	DEV_CLEARTEXT_MARKER,
	devCleartextManifest,
	hasDevCleartext,
	needsDevCleartext,
	withDevCleartext,
} from "../../../lib/services/android/dev-cleartext-manifest";

describe("dev-cleartext-manifest", () => {
	describe("needsDevCleartext", () => {
		it("is true only for Vite debug HMR runs", () => {
			assert.isTrue(
				needsDevCleartext({ bundler: "vite" }, { hmr: true, release: false }),
			);
			assert.isFalse(
				needsDevCleartext({ bundler: "vite" }, { hmr: true, release: true }),
			);
			assert.isFalse(
				needsDevCleartext({ bundler: "vite" }, { hmr: false, release: false }),
			);
			assert.isFalse(
				needsDevCleartext(
					{ bundler: "webpack" },
					{ hmr: true, release: false },
				),
			);
		});
	});

	describe("devCleartextManifest", () => {
		it("permits cleartext and overrides a main manifest's value", () => {
			const manifest = devCleartextManifest();
			assert.include(manifest, 'android:usesCleartextTraffic="true"');
			assert.include(manifest, 'tools:replace="android:usesCleartextTraffic"');
			assert.include(
				manifest,
				'xmlns:tools="http://schemas.android.com/tools"',
			);
			assert.isTrue(hasDevCleartext(manifest));
		});
	});

	describe("hasDevCleartext", () => {
		it("only recognizes a manifest the CLI marked", () => {
			assert.isFalse(hasDevCleartext(null));
			assert.isFalse(
				hasDevCleartext(
					'<manifest><application android:usesCleartextTraffic="true"/></manifest>',
				),
			);
		});
	});

	describe("withDevCleartext", () => {
		it("adds the attribute, tools:replace and the tools namespace to the app's debug manifest", () => {
			const result = withDevCleartext(
				[
					'<?xml version="1.0" encoding="utf-8"?>',
					'<manifest xmlns:android="http://schemas.android.com/apk/res/android">',
					'\t<application android:debuggable="true">',
					'\t\t<activity android:name="a.B"/>',
					"\t</application>",
					"</manifest>",
				].join("\n"),
			);
			assert.include(result, 'xmlns:tools="http://schemas.android.com/tools"');
			assert.match(
				result,
				/<application tools:replace="android:usesCleartextTraffic" android:usesCleartextTraffic="true" android:debuggable="true">/,
			);
			assert.include(result, '<activity android:name="a.B"/>');
			assert.include(result, DEV_CLEARTEXT_MARKER);
			assert.match(result, /^<\?xml/);
		});

		it("turns an explicit false into true and extends an existing tools:replace", () => {
			const result = withDevCleartext(
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android" xmlns:tools="http://schemas.android.com/tools"><application android:usesCleartextTraffic="false" tools:replace="android:label"/></manifest>',
			);
			assert.include(result, 'android:usesCleartextTraffic="true"');
			assert.notInclude(result, 'usesCleartextTraffic="false"');
			assert.include(
				result,
				'tools:replace="android:label,android:usesCleartextTraffic"',
			);
			assert.equal(result.match(/xmlns:tools=/g).length, 1);
		});

		it("adds an application element when the manifest has none", () => {
			const result = withDevCleartext(
				'<manifest xmlns:android="http://schemas.android.com/apk/res/android">\n\t<uses-permission android:name="x"/>\n</manifest>',
			);
			assert.match(
				result,
				/<application android:usesCleartextTraffic="true" tools:replace="android:usesCleartextTraffic" \/>\n<\/manifest>/,
			);
		});
	});
});
