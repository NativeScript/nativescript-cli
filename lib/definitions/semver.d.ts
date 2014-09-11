
declare module "semver" {
	function gt(version1: string, version2: string): boolean;
	function lt(version1: string, version2: string): boolean;
	function eq(version1: string, version2: string): boolean;
	function valid(version: string): boolean;
	function inc(version: string, release: string): string;
	function inc(version: string, release: "major"): string;
	function inc(version: string, release: 'premajor'): string;
	function inc(version: string, release: 'minor'): string;
	function inc(version: string, release: 'preminor'): string;
	function inc(version: string, release: 'patch'): string;
	function inc(version: string, release: 'prepatch'): string;
	function inc(version: string, release: 'prerelease'): string;
}
