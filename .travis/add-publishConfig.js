#!/usr/bin/env node

const fsModule = require("fs");
const path = "./package.json";
const fileOptions = { encoding: "utf-8" };
const content = fsModule.readFileSync(path, fileOptions);

const packageDef = JSON.parse(content);
if (!packageDef.publishConfig) {
	packageDef.publishConfig = {};
}

const branch = process.argv[2];
if (!branch) {
	console.log("Please pass the branch name as an argument!");
	process.exit(1);
}

switch (branch) {
	case "release":
		packageDef.publishConfig.tag = "rc";
		break;
	case "release-patch":
		packageDef.publishConfig.tag = "patch";
		break;
	case "master":
		packageDef.publishConfig.tag = "next";
		break;
	case "feature/webpack-only":
		packageDef.publishConfig.tag = "webpack";
		break;
	default:
		throw new Error(`Unable to publish as the branch ${branch} does not have corresponding tag. Supported branches are master (next tag), release (rc tag) and release-patch (patch tag)`);
}

const newContent = JSON.stringify(packageDef, null, "  ");
fsModule.writeFileSync(path, newContent, fileOptions);
