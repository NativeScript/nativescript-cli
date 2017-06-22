#!/usr/bin/env node

const fsModule = require("fs");
const path = "./package.json";
const fileOptions = {encoding: "utf-8"};
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
packageDef.publishConfig.tag = branch === "release" ? "rc" : "next";

const newContent = JSON.stringify(packageDef, null, "  ");
fsModule.writeFileSync(path, newContent, fileOptions);
