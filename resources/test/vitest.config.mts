import { defineConfig } from 'vitest/config';
import { nativeScript } from '@nativescript/unit-test-runner';

// Platform is selected per run: `ns test ios` / `ns test android` /
// `ns test visionos`, or NS_PLATFORM=ios npx vitest run
export default defineConfig({
	plugins: [
		nativeScript({
			platform: process.env.NS_PLATFORM || 'ios', // 'android' | 'ios' | 'visionos'
			device: process.env.NS_DEVICE || undefined,
		}),
	],
	test: {
		// Device runs include app startup and real layout passes.
		testTimeout: 30_000,
	},
});
