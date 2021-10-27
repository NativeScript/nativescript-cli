#!/usr/bin/env node

import { run } from "envinfo";
import { readFileSync } from "fs";
import { resolve } from "path";

interface IPackageJSON {
	dependencies?: any;
	devDependencies?: any;
}

function readPackageJSON(): IPackageJSON {
	try {
		return JSON.parse(
			readFileSync(resolve(process.cwd(), "package.json")).toString()
		);
	} catch (err) {
		return {};
	}
}

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

	const packageJSON = readPackageJSON();
	const dependencies = packageJSON?.dependencies ?? {};
	const devDependencies = packageJSON?.devDependencies ?? {};

	const get = (key: string, defaultValue: any = "Not Found") => {
		try {
			return key.split(".").reduce((res, key) => res[key], res) ?? defaultValue;
		} catch (err) {
			return defaultValue;
		}
	};

	const asList = (key: string) => {
		const list = get(key);

		if (Array.isArray(list)) {
			return "\n" + list.map((image: string) => `  - ${image}`).join("\n");
		}

		return list ?? "Not Found";
	};

	console.log(
		[
			`<!-- COPY START -->`,
			"```yaml",
			`OS: ${get("System.OS")}`,
			`CPU: ${get("System.CPU")}`,
			`Shell: ${get("System.Shell.path")}`,
			`node: ${get("Binaries.Node.version")}`,
			`npm: ${get("Binaries.npm.version")}`,
			`nativescript: ${get("npmGlobalPackages.nativescript")}`,
			// `git: ${sysInfo.gitVer}`,
			``,
			`# android`,
			`java: ${get("Languages.Java.version")}`,
			`ndk: ${get("SDKs.Android SDK.Android NDK")}`,
			`apis: ${
				get("SDKs.Android SDK.API Levels")?.join?.(", ") ?? "Not Found"
			}`,
			`build_tools: ${
				get("SDKs.Android SDK.Build Tools")?.join?.(", ") ?? "Not Found"
			}`,
			`system_images: ` + asList("SDKs.Android SDK.System Images"),
			``,
			`# ios`,
			`xcode: ${get("IDEs.Xcode.version")}`,
			`cocoapods: ${get("Managers.CocoaPods.version")}`,
			`python: ${get("Languages.Python.version")}`,
			`python3: ${get("Languages.Python3.version")}`,
			`ruby: ${get("Languages.Ruby.version")}`,
			`platforms: ` + asList("SDKs.iOS SDK.Platforms"),
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
