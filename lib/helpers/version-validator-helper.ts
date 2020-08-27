import * as semver from "semver";

export class VersionValidatorHelper {
	protected isValidVersion(version: string): string {
		return semver.valid(version) || semver.validRange(version);
	}

	protected isVersionGreaterThan(v1: string, v2: string): boolean {
		return this.compareCoerceVersions(v1, v2, semver.gt);
	}

	protected isVersionGreaterOrEqualThan(v1: string, v2: string): boolean {
		return this.compareCoerceVersions(v1, v2, semver.gte);
	}

	protected isVersionLowerThan(v1: string, v2: string): boolean {
		return this.compareCoerceVersions(v1, v2, semver.lt);
	}

	protected isVersionLowerOrEqualThan(v1: string, v2: string): boolean {
		return this.compareCoerceVersions(v1, v2, semver.lte);
	}

	private compareCoerceVersions(
		version: string,
		minVersion: string,
		condition: Function
	): boolean {
		return condition(semver.coerce(version), semver.coerce(minVersion));
	}
}
