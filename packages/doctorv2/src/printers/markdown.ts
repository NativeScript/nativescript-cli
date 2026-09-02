import { green } from "ansi-colors";
import { details, IRequirementResult, RequirementDetails } from "..";

export function printResults(data: {
	results: IRequirementResult[];
	details: RequirementDetails;
}) {
	const asYamlList = (list: string[]) => {
		if (Array.isArray(list)) {
			return "\n" + list.map((item: string) => `  - ${item}`).join("\n");
		}

		return list ?? "Not Found";
	};

	const md = [
		`<!-- COPY START -->`,
		"```yaml",
		`OS: ${details.os.name} ${details.os.version}`,
		`CPU: ${details.cpu}`,
		`Shell: ${details.shell}`,
		`node: ${details.node.version} (${details.node.path})`,
		`npm: ${details.npm.version}`,
		`nativescript: ${details.nativescript.version}`,
		``,
		`# android`,
		`java: ${details.java.version}`,
		`javac: ${details.javac.version}`,
		`ndk: ${asYamlList(details.android.installedNDKVersions)}`,
		`apis: ${asYamlList(details.android.installedTargets)}`,
		`build_tools: ${asYamlList(details.android.installedBuildTools)}`,
		`system_images: ${asYamlList(details.android.installedSystemImages)}`,
		``,
		`# ios`,
		`xcode: ${details.xcode.version} (${details.xcode.buildVersion})`,
		`cocoapods: ${details.cocoapods.version}`,
		`python: ${details.python.version}`,
		// `ruby: ${details.ruby.version}`,
		`platforms: ${asYamlList(details.ios.platforms)}`,
		"```",
		``,
		`### Dependencies`,
		``,
		"```json",
		'"dependencies": ' + JSON.stringify({}, null, 2) + ",",
		'"devDependencies": ' + JSON.stringify({}, null, 2),
		"```",
		`<!-- COPY END -->`,
		``,
		green.bold(`√ Results have been copied to your clipboard`),
		``,
	].join("\n");

	console.log(md);
}
