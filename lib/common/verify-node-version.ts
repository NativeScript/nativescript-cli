// This function must be separate to avoid dependencies on C++ modules - it must execute precisely when other functions cannot

import { color } from "../color";
import { ISystemWarning } from "./declarations";

// Use only ES5 code here - pure JavaScript can be executed with any Node.js version (even 0.10, 0.12).
/* tslint:disable:no-var-keyword no-var-requires prefer-const*/
var os = require("os");
var semver = require("semver");
var util = require("util");

// These versions cannot be used with CLI due to bugs in the node itself.
// We are absolutely sure we cannot work with them, so inform the user if he is trying to use any of them and exit the process.
var versionsCausingFailure = ["0.10.34", "4.0.0", "4.2.0", "5.0.0"];
var minimumRequiredVersion = "8.0.0";

interface INodeVersionOpts {
	supportedVersionsRange: string;
	cliName: string;
	deprecatedVersions?: string[];
	nodeVer: string;
}

function getNodeVersionOpts(): INodeVersionOpts {
	var supportedVersionsRange = require("../../package.json").engines.node;
	var cliName = "NativeScript";
	var deprecatedVersions = ["^8.0.0", "^9.0.0"];
	var nodeVer = process.version.substr(1);
	return {
		supportedVersionsRange: supportedVersionsRange,
		cliName: cliName,
		nodeVer: nodeVer,
		deprecatedVersions: deprecatedVersions
	};
}

export function verifyNodeVersion(): void {
	var verificationOpts = getNodeVersionOpts();
	var cliName = verificationOpts.cliName;
	var supportedVersionsRange = verificationOpts.supportedVersionsRange;
	var nodeVer = verificationOpts.nodeVer;

	if (
		versionsCausingFailure.indexOf(nodeVer) !== -1 ||
		!semver.valid(nodeVer) ||
		semver.lt(nodeVer, minimumRequiredVersion)
	) {
		console.error(
			color.red.bold(
				util.format(
					"%sNode.js '%s' is not supported. To be able to work with %s CLI, install any Node.js version in the following range: %s.%s",
					os.EOL,
					nodeVer,
					cliName,
					supportedVersionsRange,
					os.EOL
				)
			)
		);
		process.exit(1);
	}
}

var nodeWarn: ISystemWarning = undefined;
export function getNodeWarning(): ISystemWarning {
	if (nodeWarn === undefined) {
		nodeWarn = null;
		var verificationOpts = getNodeVersionOpts();
		var cliName = verificationOpts.cliName;
		var supportedVersionsRange = verificationOpts.supportedVersionsRange;
		var deprecatedVersions = verificationOpts.deprecatedVersions;
		var nodeVer = verificationOpts.nodeVer;

		var warningMessage = "";
		if (deprecatedVersions) {
			deprecatedVersions.forEach(function (version) {
				if (semver.satisfies(nodeVer, version)) {
					warningMessage =
						"Support for Node.js " +
						version +
						" is deprecated and will be removed in one of the next releases of " +
						cliName +
						". Please, upgrade to the latest Node.js LTS version. ";
					return warningMessage;
				}
			});
		}

		if (!warningMessage) {
			var checkSatisfied = semver.satisfies(nodeVer, supportedVersionsRange);
			if (!checkSatisfied) {
				warningMessage =
					"Support for Node.js " +
					nodeVer +
					" is not verified. " +
					cliName +
					" CLI might not install or run properly.";
			}
		}

		if (warningMessage) {
			nodeWarn = {
				message: warningMessage,
				severity: SystemWarningsSeverity.medium
			};
		}
	}

	return nodeWarn;
}
/* tslint:enable */
