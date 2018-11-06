
import * as semver from "semver";

export class VersionValidatorHelper {
	protected isValidVersion(version: string): string {
		return semver.valid(version) || semver.validRange(version);
	}

	protected compareCoerceVersions(version: string, minVersion: string, comperator: Function): boolean {
		return comperator(semver.coerce(version), semver.coerce(minVersion));
	}
}
