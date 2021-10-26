#!/usr/bin/env node

import { run } from "envinfo";
import { readFile } from "fs/promises";
import { resolve } from "path";

async function main() {
	const res = JSON.parse(
		await run(
			{
				System: ["OS", "CPU", "Shell"],
				Binaries: ["Node", "npm"],
				Managers: ["CocoaPods"],
				IDEs: ["Xcode"],
				SDKs: ["iOS SDK", "Android SDK"],
				Languages: ["Java", "Ruby", "Python", "Python3"],
				npmGlobalPackages: ["nativescript"],
			},
			{ json: true, showNotFound: true }
		)
	);

	const packageJSON = await readFile(resolve(process.cwd(), "package.json"))
		.then((res: Buffer) => JSON.parse(res.toString()))
		.catch(() => {});

	const dependencies = packageJSON?.dependencies ?? {};
	const devDependencies = packageJSON?.devDependencies ?? {};

	console.log(
		[
			`<!-- COPY START -->`,
			"```yaml",
			`OS: ${res.System.OS}`,
			`CPU: ${res.System.CPU}`,
			`Shell: ${res.System.Shell.path}`,
			`node: ${res.Binaries.Node.version}`,
			`npm: ${res.Binaries.npm.version}`,
			`nativescript: ${res.npmGlobalPackages.nativescript}`,
			// `git: ${sysInfo.gitVer}`,
			``,
			`# android`,
			`java: ${res.Languages.Java.version}`,
			`ndk: ${res["SDKs"]["Android SDK"]["Android NDK"]}`,
			`apis: ${res["SDKs"]["Android SDK"]["API Levels"].join(", ")}`,
			`build_tools: ${res["SDKs"]["Android SDK"]["Build Tools"].join(", ")}`,
			`system_images: `,
			...res["SDKs"]["Android SDK"]["System Images"].map(
				(image: string) => `  - ${image}`
			),
			``,
			`# ios`,
			`xcode: ${res.IDEs.Xcode.version}`,
			`cocoapods: ${res.Managers.CocoaPods.version}`,
			`python: ${res.Languages.Python.version}`,
			`python3: ${res.Languages.Python3.version}`,
			`ruby: ${res.Languages.Ruby.version}`,
			`platforms:`,
			...res.SDKs["iOS SDK"]["Platforms"].map(
				(platform: string) => `  - ${platform}`
			),
			"```",
			``,
			`### Dependencies`,
			``,
			"```json",
			'"dependencies": ' + JSON.stringify(dependencies, null, 2) + ",",
			'"devDependencies": ' + JSON.stringify(devDependencies, null, 2),
			"```",
			`<!-- COPY END -->`,
		].join("\n")
	);
}

main();
