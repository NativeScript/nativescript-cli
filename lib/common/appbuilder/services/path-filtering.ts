import minimatch = require("minimatch");

export class PathFilteringService implements IPathFilteringService {

	constructor(private $fs: IFileSystem) { }

	public getRulesFromFile(fullFilePath: string): string[] {
		const COMMENT_START = '#';
		let rules: string[] = [];

		try {
			const fileContent = this.$fs.readText(fullFilePath);
			rules = _.reject(fileContent.split(/[\n\r]/),
				(line: string) => line.length === 0 || line[0] === COMMENT_START);

		} catch (e) {
			if (e.code !== "ENOENT") { // file not found
				throw e;
			}
		}

		return rules;
	}

	public filterIgnoredFiles(files: string[], rules: string[], rootDir: string): string[] {
		return _.reject(files, file => this.isFileExcluded(file, rules, rootDir));
	}

	public isFileExcluded(file: string, rules: string[], rootDir: string): boolean {
		file = file.replace(rootDir, "").replace(new RegExp("^[\\\\|/]*"), "");
		let fileMatched = true;
		_.each(rules, rule => {
			// minimatch treats starting '!' as pattern negation
			// but we want the pattern matched and then do something else with the file
			// therefore, we manually handle leading ! and \! and hide them from minimatch
			const shouldInclude = rule[0] === '!';
			if (shouldInclude) {
				rule = rule.substr(1);
				const ruleMatched = minimatch(file, rule, { nocase: true, dot: true });
				if (ruleMatched) {
					fileMatched = true;
				}
			} else {
				const options = { nocase: true, nonegate: false, dot: true };
				if (rule[0] === '\\' && rule[1] === '!') {
					rule = rule.substr(1);
					options.nonegate = true;
				}
				const ruleMatched = minimatch(file, rule, options);
				fileMatched = fileMatched && !ruleMatched;
			}
		});

		return !fileMatched;
	}
}

$injector.register("pathFilteringService", PathFilteringService);
