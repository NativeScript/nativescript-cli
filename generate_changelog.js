"use strict";

const _ = require("lodash");
const request = require("request");
const fs = require("fs");
const path = require("path");
require("colors");

const argv = process.argv;
if (argv.length < 3 || argv.length > 4) {
	console.error(`Incorrect usage. You need to pass the milestone and optionally the Authorization token.\n`.red +
		`### Example:
node generate_changelog.js 6.2.2 2d2156c261bb1494f7a6e22f11fa446c7ca0e6b7\n`.yellow);
	process.exit(127);
}

const selectedMilestone = process.argv[2];
const token = process.argv[3] || process.env.NS_CLI_CHANGELOG_AUTHORIZATION;
if (!token) {
	console.error(`Unable to find Authorization token.\n`.red +
		`You must either set NS_CLI_CHANGELOG_AUTHORIZATION environment variable or pass the token as an argument to the script:\n`.yellow +
		`node generate_changelog.js 6.2.2 2d2156c261bb1494f7a6e22f11fa446c7ca0e6b7\n`.green);
	process.exit(127);
}

const sendRequest = (query) => {
	return new Promise((resolve, reject) => {
		request.post("https://api.github.com/graphql", {
			headers: {
				"Accept": "application/json",
				"Authorization": `Bearer ${token}`,
				"User-Agent": "NativeScript CLI Changelog Generator"
			},
			body: JSON.stringify(query),
			followAllRedirects: true
		}, (err, response, body) => {
			if (err) {
				reject(err);
				return;
			}
			resolve(JSON.parse(body));
		});
	});
};

const getMilestonesInfoQuery = {
	query: `{
	repository(owner:"NativeScript", name:"nativescript-cli") {
		milestones(first: 100, states: OPEN) {
			nodes {
				number
				id
				title
				url
			}
		}
	}
}`
};

sendRequest(getMilestonesInfoQuery)
	.then(result => {
		const milestones = result && result.data && result.data.repository && result.data.repository.milestones && result.data.repository.milestones.nodes || [];
		const matchingMilestone = _.find(milestones, m => m.title === selectedMilestone);
		if (!matchingMilestone) {
			throw new Error(`Unable to find milestone ${selectedMilestone} in the milestones. Current milestones info is: ${JSON.stringify(milestones, null, 2)}`);
		}
		return matchingMilestone.number;
	})
	.then((milestone) => {
		const getItemsForMilestoneQuery = {
			query: `{
	repository(owner:"NativeScript", name:"nativescript-cli") {
		milestone(number: ${milestone}) {
			number
			id
			issuePrioritiesDebug
			url
			issues(first: 100) {
				nodes {
					title
					url
					number
					labels(first:100) {
						edges {
							node {
								name
							}
						}
					}
					projectCards(first: 100) {
						nodes {
							column {
								name
							}
							project {
								name
								number
							}
							state
						}
					}
				}
			}
		}
	}
}`
		};
		return sendRequest(getItemsForMilestoneQuery);
	})
	.then((milestoneQueryResult) => {
		const issues = (milestoneQueryResult && milestoneQueryResult.data && milestoneQueryResult.data.repository &&
			milestoneQueryResult.data.repository.milestone && milestoneQueryResult.data.repository.milestone.issues &&
			milestoneQueryResult.data.repository.milestone.issues.nodes) || [];
		const finalIssuesForChangelog = [];
		issues.forEach((issue) => {
			const labels = ((issue.labels && issue.labels.edges) || []).map((lblObj) => lblObj && lblObj.node && lblObj.node.name);
			const isFeature = labels.indexOf("feature") !== -1;
			const isBug = labels.indexOf("bug") !== -1;
			const shouldBeSkipped = labels.indexOf("no-changelog") !== -1;
			if (isFeature && isBug) {
				console.error(`The item '${issue.title}' has both bug and feature label. Clear one of them and try again.`.red);
				process.exit(1);
			} else if (shouldBeSkipped) {
				console.log(`Item ${issue && issue.url}(${issue && issue.title}) will not be included in changelog as it has no-changelog label`.yellow);
			} else {
				// check if we have resolved it:
				const columns = (issue && issue.projectCards && issue.projectCards.nodes || []).map(c => c && c.column && c.column.name);
				// There shouldn't be more than one columns.
				const column = _.first(columns);
				if (columns && column === "Ready for Test" || column === "In Testing" || column === "Done") {
					finalIssuesForChangelog.push({
						type: isFeature ? "feature" : "bug",
						number: issue && issue.number,
						title: issue && issue.title,
						url: issue && issue.url
					});
				} else {
					console.log(`Item ${issue && issue.url}(${issue && issue.title}) will not be included in changelog as its status is ${columns}`.yellow);
				}
			}
		});

		return finalIssuesForChangelog;
	})
	.then(data => {
		const features = [];
		const bugs = [];

		_.sortBy(data, (d) => d.number)
			.forEach(d => {
				if (d.type === "feature") {
					features.push(`* [Implemented #${d.number}](${d.url}): ${d.title}`);
				} else {
					bugs.push(`* [Fixed #${d.number}](${d.url}): ${d.title}`);
				}
			});

		const pathToChangelog = path.join(__dirname, "CHANGELOG.md");
		let changelogContent = fs.readFileSync(pathToChangelog).toString();

		if (features.length === 0 && bugs.length === 0) {
			console.error(`Unable to find anything ready for milestone ${selectedMilestone}`.red);
			process.exit(2);
		}

		const monthNames = ["January", "February", "March", "April", "May", "June",
			"July", "August", "September", "October", "November", "December"
		];
		const currentDate = new Date();

		let newChangelogContent = `\n${selectedMilestone} (${currentDate.getFullYear()}, ${monthNames[currentDate.getMonth()]} ${currentDate.getDate()})
===
`;
		if (features.length > 0) {
			newChangelogContent += `
### New

${features.join("\n")}
`;
		}
		if (bugs.length) {
			newChangelogContent += `
### Fixed

${bugs.join("\n")}
`;
		}

		changelogContent = changelogContent.replace(/(NativeScript CLI Changelog\r?\n=+\r?\n)([\s\S]*)/m, `$1${newChangelogContent}\n$2`);
		fs.writeFileSync(pathToChangelog, changelogContent);
		console.log(`Successfully added Changelog for ${selectedMilestone}`.green);
		console.log("Commit the local changes and send a PR.".magenta);
	})
	.catch(error => console.error(error));