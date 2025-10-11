import * as semver from "semver";

export function isInRange(
	version: string,
	range: { min?: string; max?: string }
) {
	try {
		const _version = semver.coerce(version);

		let _range: string;
		if (range.min && !range.max) {
			_range = `>=${range.min}`;
		} else if (range.max && !range.min) {
			_range = `<=${range.max}`;
		} else if (range.min && range.max) {
			_range = `${range.min} - ${range.max}`;
		} else {
			// no min or max - return true
			return true;
		}
		const _inRange = semver.satisfies(_version, _range);

		// console.log({
		// 	_version: _version.toString(),
		// 	_range,
		// 	_inRange,
		// });

		return _inRange;
	} catch (err) {
		console.log("isInRange err", err);
		return false;
	}
}

export function notInRange(
	version: string,
	range: { min?: string; max?: string }
) {
	return !isInRange(version, range);
}

// export function padVersion(version: string, digits = 3) {
// 	if (version) {
// 		const zeroesToAppend = digits - version.split(".").length;
// 		return version + ".0".repeat(zeroesToAppend);
// 	}
// 	return version;
// }
