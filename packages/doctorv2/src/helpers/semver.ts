import * as semver from "semver";

export function isInRange(
	version: string,
	range: { min: string; max: string }
) {
	try {
		const _version = semver.coerce(version);
		const _range = `${range.min} - ${range.max}`;
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
	range: { min: string; max: string }
) {
	return !isInRange(version, range);
}
