"use strict";

const getNodeArgs = () => {
	const nodeVersion = process.version;
	const requiresHarmonyFlagRegex = /^v[45]\./;
	const nodeArgs = [];

	if (requiresHarmonyFlagRegex.test(nodeVersion)) {
		nodeArgs.push("--harmony");
	}

	return nodeArgs;
};

module.exports.getNodeArgs = getNodeArgs;