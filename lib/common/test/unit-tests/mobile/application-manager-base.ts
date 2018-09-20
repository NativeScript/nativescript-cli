import { Yok } from "../../../yok";
import { assert } from "chai";
import { CommonLoggerStub, HooksServiceStub } from "../stubs";
import { ApplicationManagerBase } from "../../../mobile/application-manager-base";

let currentlyAvailableAppsForDebugging: Mobile.IDeviceApplicationInformation[];
let currentlyInstalledApps: string[];
let currentlyAvailableAppWebViewsForDebugging: IDictionary<Mobile.IDebugWebViewInfo[]>;

class ApplicationManager extends ApplicationManagerBase {
	constructor($logger: ILogger, $hooksService: IHooksService) {
		super($logger, $hooksService);
	}

	public async isLiveSyncSupported(appIdentifier: string): Promise<boolean> {
		return true;
	}

	public async installApplication(packageFilePath: string): Promise<void> {
		return;
	}

	public async uninstallApplication(appIdentifier: string): Promise<void> {
		return;
	}

	public async startApplication(appData: Mobile.IApplicationData): Promise<void> {
		return;
	}

	public async stopApplication(appData: Mobile.IApplicationData): Promise<void> {
		return;
	}

	public async getInstalledApplications(): Promise<string[]> {
		return _.cloneDeep(currentlyInstalledApps);
	}

	public async getApplicationInfo(applicationIdentifier: string): Promise<Mobile.IApplicationInfo> {
		return null;
	}

	public async getDebuggableApps(): Promise<Mobile.IDeviceApplicationInformation[]> {
		return currentlyAvailableAppsForDebugging;
	}

	public async getDebuggableAppViews(appIdentifiers: string[]): Promise<IDictionary<Mobile.IDebugWebViewInfo[]>> {
		return _.cloneDeep(currentlyAvailableAppWebViewsForDebugging);
	}
}

function createTestInjector(): IInjector {
	const testInjector = new Yok();
	testInjector.register("logger", CommonLoggerStub);
	testInjector.register("hooksService", HooksServiceStub);
	testInjector.register("applicationManager", ApplicationManager);
	return testInjector;
}

function createAppsAvailableForDebugging(count: number): Mobile.IDeviceApplicationInformation[] {
	return _.times(count, (index: number) => ({
		deviceIdentifier: "deviceId",
		appIdentifier: `appId_${index}`,
		framework: "framework"
	}));
}

function createDebuggableWebView(uniqueId: string) {
	return {
		description: `description_${uniqueId}`,
		devtoolsFrontendUrl: `devtoolsFrontendUrl_${uniqueId}`,
		id: `${uniqueId}`,
		title: `title_${uniqueId}`,
		type: `type_${uniqueId}`,
		url: `url_${uniqueId}`,
		webSocketDebuggerUrl: `webSocketDebuggerUrl_${uniqueId}`,
	};
}

function createDebuggableWebViews(appInfos: Mobile.IDeviceApplicationInformation[], numberOfViews: number): IDictionary<Mobile.IDebugWebViewInfo[]> {
	const result: IDictionary<Mobile.IDebugWebViewInfo[]> = {};
	_.each(appInfos, (appInfo, index) => {
		result[appInfo.appIdentifier] = _.times(numberOfViews, (currentViewIndex: number) => createDebuggableWebView(`${index}_${currentViewIndex}`));
	});

	return result;
}

describe("ApplicationManagerBase", () => {
	let applicationManager: ApplicationManager;
	let testInjector: IInjector;
	const applicationData = {
		appId: "appId",
		projectName: "appName"
	};

	beforeEach(() => {
		testInjector = createTestInjector();
		currentlyAvailableAppsForDebugging = null;
		currentlyAvailableAppWebViewsForDebugging = null;
		applicationManager = testInjector.resolve("applicationManager");
	});

	describe("checkForApplicationUpdates", () => {
		describe("debuggableApps", () => {
			it("emits debuggableAppFound when new application is available for debugging", async () => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const foundAppsForDebug: Mobile.IDeviceApplicationInformation[] = [];

				applicationManager.on("debuggableAppFound", (d: Mobile.IDeviceApplicationInformation) => {
					foundAppsForDebug.push(d);
					if (foundAppsForDebug.length === currentlyAvailableAppsForDebugging.length) {
						_.each(foundAppsForDebug, (f: Mobile.IDeviceApplicationInformation, index: number) => {
							assert.deepEqual(f, currentlyAvailableAppsForDebugging[index]);
						});
					}
				});

				await applicationManager.checkForApplicationUpdates();
			});

			it("emits debuggableAppFound when new application is available for debugging (several calls)", async () => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(1);
				const foundAppsForDebug: Mobile.IDeviceApplicationInformation[] = [];
				let isFinalCheck = false;

				applicationManager.on("debuggableAppFound", (d: Mobile.IDeviceApplicationInformation) => {
					foundAppsForDebug.push(d);
					if (foundAppsForDebug.length === currentlyAvailableAppsForDebugging.length) {
						_.each(foundAppsForDebug, (f: Mobile.IDeviceApplicationInformation, index: number) => {
							assert.deepEqual(f, currentlyAvailableAppsForDebugging[index]);
						});

						if (isFinalCheck) {
							return;
						}
					}
				});

				await applicationManager.checkForApplicationUpdates();
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				await applicationManager.checkForApplicationUpdates();
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(4);
				isFinalCheck = true;
				await applicationManager.checkForApplicationUpdates();
			});

			it("emits debuggableAppLost when application cannot be debugged anymore", async () => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const expectedAppsToBeLost = currentlyAvailableAppsForDebugging,
					lostAppsForDebug: Mobile.IDeviceApplicationInformation[] = [];

				applicationManager.on("debuggableAppLost", (d: Mobile.IDeviceApplicationInformation) => {
					lostAppsForDebug.push(d);

					if (lostAppsForDebug.length === expectedAppsToBeLost.length) {
						_.each(lostAppsForDebug, (f: Mobile.IDeviceApplicationInformation, index: number) => {
							assert.deepEqual(f, expectedAppsToBeLost[index]);
						});
					}
				});

				// First call will raise debuggableAppFound two times.
				await applicationManager.checkForApplicationUpdates();
				currentlyAvailableAppsForDebugging = [];
				// This call should raise debuggableAppLost two times.
				await applicationManager.checkForApplicationUpdates();
			});

			it("emits debuggableAppLost when application cannot be debugged anymore (several calls)", async () => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(4);
				const lostAppsForDebug: Mobile.IDeviceApplicationInformation[] = [];
				let isFinalCheck = false;
				const initialAppsAvailableForDebug = currentlyAvailableAppsForDebugging;

				applicationManager.on("debuggableAppLost", (d: Mobile.IDeviceApplicationInformation) => {
					lostAppsForDebug.push(d);
					_.each(lostAppsForDebug, (f: Mobile.IDeviceApplicationInformation, index: number) => {
						assert.deepEqual(f, _.find(initialAppsAvailableForDebug, t => t.appIdentifier === f.appIdentifier));
					});

					if (lostAppsForDebug.length === initialAppsAvailableForDebug.length && isFinalCheck) {
						return;
					}
				});

				await applicationManager.checkForApplicationUpdates();
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				await applicationManager.checkForApplicationUpdates();
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(0);
				isFinalCheck = true;
				await applicationManager.checkForApplicationUpdates();
			});

			it("emits debuggableAppFound and debuggableAppLost when applications are changed", async () => {
				const allAppsForDebug = createAppsAvailableForDebugging(4);
				currentlyAvailableAppsForDebugging = _.take(allAppsForDebug, 2);
				const remainingAppsForDebugging = _.difference(allAppsForDebug, currentlyAvailableAppsForDebugging);

				const foundAppsForDebug: Mobile.IDeviceApplicationInformation[] = [];

				// This will raise debuggableAppFound 2 times.
				await applicationManager.checkForApplicationUpdates();

				const foundAppsPromise = new Promise<void>((resolve, reject) => {
					applicationManager.on("debuggableAppFound", (d: Mobile.IDeviceApplicationInformation) => {
						foundAppsForDebug.push(d);
						if (foundAppsForDebug.length === remainingAppsForDebugging.length) {
							_.each(foundAppsForDebug, (f: Mobile.IDeviceApplicationInformation, index: number) => {
								assert.deepEqual(f, remainingAppsForDebugging[index]);
							});

							resolve();
						}
					});
				});

				const lostAppsPromise = new Promise<void>((resolve, reject) => {
					applicationManager.on("debuggableAppLost", (d: Mobile.IDeviceApplicationInformation) => {
						assert.deepEqual(d, allAppsForDebug[0], "Debuggable app lost does not match.");
						resolve();
					});
				});

				currentlyAvailableAppsForDebugging = _.drop(allAppsForDebug, 1);
				await applicationManager.checkForApplicationUpdates();
				await Promise.all([foundAppsPromise, lostAppsPromise]);
			});

			it("emits debuggableViewFound when new views are available for debug", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const numberOfViewsPerApp = 2;
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, numberOfViewsPerApp);
				const currentDebuggableViews: IDictionary<Mobile.IDebugWebViewInfo[]> = {};
				applicationManager.on("debuggableViewFound", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
					currentDebuggableViews[appIdentifier] = currentDebuggableViews[appIdentifier] || [];
					currentDebuggableViews[appIdentifier].push(d);
					const numberOfFoundViewsPerApp = _.uniq(_.values(currentDebuggableViews).map(arr => arr.length));
					if (_.keys(currentDebuggableViews).length === currentlyAvailableAppsForDebugging.length
						&& numberOfFoundViewsPerApp.length === 1 // for all apps we've found exactly two apps.
						&& numberOfFoundViewsPerApp[0] === numberOfViewsPerApp) {
						_.each(currentDebuggableViews, (webViews, appId) => {
							_.each(webViews, webView => {
								const expectedWebView = _.find(currentlyAvailableAppWebViewsForDebugging[appId], c => c.id === webView.id);
								assert.isTrue(_.isEqual(webView, expectedWebView));
							});
						});
						setTimeout(done, 0);
					}
				});

				/* tslint:disable:no-floating-promises */
				applicationManager.checkForApplicationUpdates();
				/* tslint:enable:no-floating-promises */
			});

			it("emits debuggableViewLost when views for debug are removed", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const numberOfViewsPerApp = 2;
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, numberOfViewsPerApp);
				const expectedResults = _.cloneDeep(currentlyAvailableAppWebViewsForDebugging);
				const currentDebuggableViews: IDictionary<Mobile.IDebugWebViewInfo[]> = {};

				applicationManager.checkForApplicationUpdates()
					.then(() => {
						applicationManager.on("debuggableViewLost", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							currentDebuggableViews[appIdentifier] = currentDebuggableViews[appIdentifier] || [];
							currentDebuggableViews[appIdentifier].push(d);
							const numberOfFoundViewsPerApp = _.uniq(_.values(currentDebuggableViews).map(arr => arr.length));
							if (_.keys(currentDebuggableViews).length === currentlyAvailableAppsForDebugging.length
								&& numberOfFoundViewsPerApp.length === 1 // for all apps we've found exactly two apps.
								&& numberOfFoundViewsPerApp[0] === numberOfViewsPerApp) {
								_.each(currentDebuggableViews, (webViews, appId) => {
									_.each(webViews, webView => {
										const expectedWebView = _.find(expectedResults[appId], c => c.id === webView.id);
										assert.isTrue(_.isEqual(webView, expectedWebView));
									});
								});
								setTimeout(done, 0);
							}
						});

						currentlyAvailableAppWebViewsForDebugging = _.mapValues(currentlyAvailableAppWebViewsForDebugging, (a) => []);
						return applicationManager.checkForApplicationUpdates();
					})
					.catch();
			});

			it("emits debuggableViewFound when new views are available for debug", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const numberOfViewsPerApp = 2;
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, numberOfViewsPerApp);
				let expectedViewToBeFound = createDebuggableWebView("uniqueId");
				let expectedAppIdentifier = currentlyAvailableAppsForDebugging[0].appIdentifier;
				let isLastCheck = false;

				applicationManager.checkForApplicationUpdates()
					.then(() => {
						applicationManager.on("debuggableViewFound", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							assert.deepEqual(appIdentifier, expectedAppIdentifier);
							assert.isTrue(_.isEqual(d, expectedViewToBeFound));

							if (isLastCheck) {
								setTimeout(done, 0);
							}
						});

						currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].push(_.cloneDeep(expectedViewToBeFound));
						return applicationManager.checkForApplicationUpdates();
					})
					.catch()
					.then(() => {
						expectedViewToBeFound = createDebuggableWebView("uniqueId1");
						currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].push(_.cloneDeep(expectedViewToBeFound));
						return applicationManager.checkForApplicationUpdates();
					})
					.catch()
					.then(() => {
						expectedViewToBeFound = createDebuggableWebView("uniqueId2");
						expectedAppIdentifier = currentlyAvailableAppsForDebugging[1].appIdentifier;
						isLastCheck = true;

						currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].push(_.cloneDeep(expectedViewToBeFound));
						return applicationManager.checkForApplicationUpdates();
					})
					.catch();
			});

			it("emits debuggableViewLost when views for debug are not available anymore", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(2);
				const numberOfViewsPerApp = 2;
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, numberOfViewsPerApp);
				let expectedAppIdentifier = currentlyAvailableAppsForDebugging[0].appIdentifier;
				let expectedViewToBeLost = currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].splice(0, 1)[0];
				let isLastCheck = false;

				applicationManager.checkForApplicationUpdates()
					.then(() => {
						applicationManager.on("debuggableViewLost", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							assert.deepEqual(appIdentifier, expectedAppIdentifier);
							assert.isTrue(_.isEqual(d, expectedViewToBeLost));

							if (isLastCheck) {
								setTimeout(done, 0);
							}
						});

						return applicationManager.checkForApplicationUpdates();
					})
					.catch()
					.then(() => {
						expectedViewToBeLost = currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].splice(0, 1)[0];
						return applicationManager.checkForApplicationUpdates();
					})
					.catch()
					.then(() => {
						expectedAppIdentifier = currentlyAvailableAppsForDebugging[1].appIdentifier;
						expectedViewToBeLost = currentlyAvailableAppWebViewsForDebugging[expectedAppIdentifier].splice(0, 1)[0];

						isLastCheck = true;
						return applicationManager.checkForApplicationUpdates();
					})
					.catch();
			});

			it("emits debuggableViewChanged when view's property is modified (each one except id)", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(1);
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, 2);
				const viewToChange = currentlyAvailableAppWebViewsForDebugging[currentlyAvailableAppsForDebugging[0].appIdentifier][0];
				const expectedView = _.cloneDeep(viewToChange);
				expectedView.title = "new title";

				applicationManager.on("debuggableViewChanged", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
					assert.isTrue(_.isEqual(d, expectedView));
					setTimeout(done, 0);
				});

				applicationManager.checkForApplicationUpdates()
					.then(() => {
						viewToChange.title = "new title";
						return applicationManager.checkForApplicationUpdates();
					})
					.catch();
			});

			it("does not emit debuggableViewChanged when id is modified", (done: mocha.Done) => {
				currentlyAvailableAppsForDebugging = createAppsAvailableForDebugging(1);
				currentlyAvailableAppWebViewsForDebugging = createDebuggableWebViews(currentlyAvailableAppsForDebugging, 2);
				const viewToChange = currentlyAvailableAppWebViewsForDebugging[currentlyAvailableAppsForDebugging[0].appIdentifier][0];
				const expectedView = _.cloneDeep(viewToChange);

				applicationManager.checkForApplicationUpdates()
					.then(() => {
						applicationManager.on("debuggableViewChanged", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							setTimeout(() => done(new Error("When id is changed, debuggableViewChanged must not be emitted.")), 0);
						});

						applicationManager.on("debuggableViewLost", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							assert.isTrue(_.isEqual(d, expectedView));
						});

						applicationManager.on("debuggableViewFound", (appIdentifier: string, d: Mobile.IDebugWebViewInfo) => {
							expectedView.id = "new id";
							assert.isTrue(_.isEqual(d, expectedView));
							setTimeout(done, 0);
						});

						viewToChange.id = "new id";
					})
					.catch()
					.then(() => applicationManager.checkForApplicationUpdates())
					.catch();
			});
		});

		describe("installed and uninstalled apps", () => {
			it("reports installed applications when initially there are apps", async () => {
				currentlyInstalledApps = ["app1", "app2", "app3"];

				const reportedInstalledApps: string[] = [],
					promise = new Promise<void>((resolve, reject) => {
						applicationManager.on("applicationInstalled", (app: string) => {
							reportedInstalledApps.push(app);
							if (reportedInstalledApps.length === currentlyInstalledApps.length) {
								resolve();
							}
						});
					});

				await applicationManager.checkForApplicationUpdates();
				await promise;

				_.each(currentlyInstalledApps, (c: string, index: number) => {
					assert.deepEqual(c, reportedInstalledApps[index]);
				});

				assert.deepEqual(reportedInstalledApps.length, currentlyInstalledApps.length);
			});

			it("reports installed applications when apps are changed between executions", async () => {
				currentlyInstalledApps = ["app1", "app2", "app3"];

				const reportedInstalledApps: string[] = [];
				let promise: Promise<void>;

				const testInstalledAppsResults = async () => {
					promise = new Promise<void>((resolve, reject) => {
						applicationManager.on("applicationInstalled", (app: string) => {
							reportedInstalledApps.push(app);
							if (reportedInstalledApps.length === currentlyInstalledApps.length) {
								applicationManager.removeAllListeners("applicationInstalled");
								resolve();
							}
						});
					});
					await applicationManager.checkForApplicationUpdates();
					await promise;

					_.each(currentlyInstalledApps, (c: string, index: number) => {
						assert.deepEqual(c, reportedInstalledApps[index]);
					});

					assert.deepEqual(reportedInstalledApps.length, currentlyInstalledApps.length);
				};

				await testInstalledAppsResults();

				currentlyInstalledApps.push("app4", "app5");
				await testInstalledAppsResults();

				currentlyInstalledApps.push("app6", "app7");
				await testInstalledAppsResults();
			});

			it("reports uninstalled applications when initially there are apps and all are uninstalled", async () => {
				currentlyInstalledApps = ["app1", "app2", "app3"];
				await applicationManager.checkForApplicationUpdates();

				const reportedUninstalledApps: string[] = [],
					initiallyInstalledApps = _.cloneDeep(currentlyInstalledApps),
					promise = new Promise<void>((resolve, reject) => {
						currentlyInstalledApps = [];

						applicationManager.on("applicationUninstalled", (app: string) => {
							reportedUninstalledApps.push(app);
							if (reportedUninstalledApps.length === initiallyInstalledApps.length) {
								resolve();
							}
						});
					});

				await applicationManager.checkForApplicationUpdates();
				await promise;

				_.each(initiallyInstalledApps, (c: string, index: number) => {
					assert.deepEqual(c, reportedUninstalledApps[index]);
				});

				assert.deepEqual(reportedUninstalledApps.length, initiallyInstalledApps.length);
			});

			it("reports uninstalled applications when apps are changed between executions", async () => {
				currentlyInstalledApps = ["app1", "app2", "app3", "app4", "app5", "app6"];
				// Initialize - all apps are marked as installed.
				await applicationManager.checkForApplicationUpdates();

				const reportedUninstalledApps: string[] = [];
				let removedApps: string[] = [];
				let promise: Promise<void>;

				const testInstalledAppsResults = async () => {
					promise = new Promise<void>((resolve, reject) => {
						applicationManager.on("applicationUninstalled", (app: string) => {
							reportedUninstalledApps.push(app);
							if (reportedUninstalledApps.length === removedApps.length) {
								applicationManager.removeAllListeners("applicationUninstalled");
								resolve();
							}
						});
					});

					await applicationManager.checkForApplicationUpdates();
					await promise;

					_.each(removedApps, (c: string, index: number) => {
						assert.deepEqual(c, reportedUninstalledApps[index]);
					});

					assert.deepEqual(reportedUninstalledApps.length, removedApps.length);
				};

				while (currentlyInstalledApps.length) {
					const currentlyRemovedApps = currentlyInstalledApps.splice(0, 2);
					removedApps = removedApps.concat(currentlyRemovedApps);
					await testInstalledAppsResults();
				}
			});

			it("reports installed and uninstalled apps when apps are changed between executions", async () => {
				currentlyInstalledApps = ["app1", "app2", "app3", "app4", "app5", "app6"];
				await applicationManager.checkForApplicationUpdates();

				const reportedUninstalledApps: string[] = [];
				const reportedInstalledApps: string[] = [];
				let installedApps: string[] = [];
				let removedApps: string[] = [];
				let appUninstalledPromise: Promise<void>;
				let appInstalledPromise: Promise<void>;

				const testInstalledAppsResults = async () => {
					appInstalledPromise = new Promise<void>((resolve, reject) => {
						applicationManager.on("applicationInstalled", (app: string) => {
							reportedInstalledApps.push(app);
							if (reportedInstalledApps.length === installedApps.length) {
								applicationManager.removeAllListeners("applicationInstalled");
								resolve();
							}
						});
					});

					appUninstalledPromise = new Promise<void>((resolve, reject) => {
						applicationManager.on("applicationUninstalled", (app: string) => {
							reportedUninstalledApps.push(app);
							if (reportedUninstalledApps.length === removedApps.length) {
								applicationManager.removeAllListeners("applicationUninstalled");
								resolve();
							}
						});
					});

					await applicationManager.checkForApplicationUpdates();

					await Promise.all([appInstalledPromise, appUninstalledPromise]);

					_.each(removedApps, (c: string, index: number) => {
						assert.deepEqual(c, reportedUninstalledApps[index]);
					});

					assert.deepEqual(reportedUninstalledApps.length, removedApps.length);

					_.each(installedApps, (c: string, index: number) => {
						assert.deepEqual(c, reportedInstalledApps[index]);
					});

					assert.deepEqual(reportedInstalledApps.length, installedApps.length);
				};

				for (let index = 10; index < 13; index++) {
					const currentlyRemovedApps = currentlyInstalledApps.splice(0, 2);
					removedApps = removedApps.concat(currentlyRemovedApps);

					const currentlyAddedApps = [`app${index}`];
					currentlyInstalledApps = currentlyInstalledApps.concat(currentlyAddedApps);
					installedApps = installedApps.concat(currentlyAddedApps);

					await testInstalledAppsResults();
				}
			});
		});
	});

	describe("isApplicationInstalled", () => {
		it("returns true when app is installed", async () => {
			currentlyInstalledApps = ["app1", "app2"];
			assert.isTrue(await applicationManager.isApplicationInstalled("app1"), "app1 is installed, so result of isAppInstalled must be true.");
			assert.isTrue(await applicationManager.isApplicationInstalled("app2"), "app2 is installed, so result of isAppInstalled must be true.");
		});

		it("returns false when app is NOT installed", async () => {
			currentlyInstalledApps = ["app1", "app2"];
			assert.isFalse(await applicationManager.isApplicationInstalled("app3"), "app3 is NOT installed, so result of isAppInstalled must be false.");
			assert.isFalse(await applicationManager.isApplicationInstalled("app4"), "app4 is NOT installed, so result of isAppInstalled must be false.");
		});
	});

	describe("restartApplication", () => {
		it("calls stopApplication with correct arguments", async () => {
			let passedApplicationData: Mobile.IApplicationData = null;
			applicationManager.stopApplication = (appData: Mobile.IApplicationData) => {
				passedApplicationData = appData;
				return Promise.resolve();
			};

			await applicationManager.restartApplication(applicationData);
			assert.deepEqual(applicationData, passedApplicationData, "When bundleIdentifier is not passed to restartApplication, stopApplication must be called with application identifier.");
		});

		it("calls startApplication with correct arguments", async () => {
			let passedApplicationData: Mobile.IApplicationData = null;
			applicationManager.startApplication = (appData: Mobile.IApplicationData) => {
				passedApplicationData = appData;
				return Promise.resolve();
			};

			await applicationManager.restartApplication(applicationData);
			assert.deepEqual(passedApplicationData, applicationData, "startApplication must be called with correct args.");
		});

		it("calls stopApplication and startApplication in correct order", async () => {
			let isStartApplicationCalled = false;
			let isStopApplicationCalled = false;

			applicationManager.stopApplication = (appData: Mobile.IApplicationData) => {
				isStopApplicationCalled = true;
				return Promise.resolve();
			};

			applicationManager.startApplication = (appData: Mobile.IApplicationData) => {
				assert.isTrue(isStopApplicationCalled, "When startApplication is called, stopApplication must have been resolved.");
				isStartApplicationCalled = true;
				return Promise.resolve();
			};

			await applicationManager.restartApplication(applicationData);
			assert.isTrue(isStopApplicationCalled, "stopApplication must be called.");
			assert.isTrue(isStartApplicationCalled, "startApplication must be called.");
		});
	});

	describe("tryStartApplication", () => {
		it("calls startApplication", async () => {
			let passedApplicationData: Mobile.IApplicationData = null;

			applicationManager.startApplication = (appData: Mobile.IApplicationData) => {
				passedApplicationData = appData;
				return Promise.resolve();
			};

			await applicationManager.tryStartApplication(applicationData);
			assert.deepEqual(passedApplicationData, applicationData);

			const secondApplicationData = { appId: "appId2", projectName: "appName2" };
			await applicationManager.tryStartApplication(secondApplicationData);
			assert.deepEqual(passedApplicationData, secondApplicationData);

		});

		describe("does not throw Error", () => {
			const error = new Error("Throw!");
			let isStartApplicationCalled = false;
			let logger: CommonLoggerStub;

			beforeEach(() => {
				isStartApplicationCalled = false;
				logger = testInjector.resolve("logger");
			});

			const assertDoesNotThrow = async (opts?: { shouldStartApplicatinThrow: boolean }) => {
				assert.deepEqual(logger.traceOutput, "");
				applicationManager.startApplication = async (appData: Mobile.IApplicationData) => {
					if (opts && opts.shouldStartApplicatinThrow) {
						throw error;
					}

					isStartApplicationCalled = true;
				};

				await applicationManager.tryStartApplication(applicationData);
				assert.isFalse(isStartApplicationCalled, "startApplication must not be called when there's an error.");
				assert.isTrue(logger.traceOutput.indexOf("Throw!") !== -1, "Error message must be shown in trace output.");
				assert.isTrue(logger.traceOutput.indexOf("Unable to start application") !== -1, "'Unable to start application' must be shown in trace output.");
			};

			it("when startApplications throws", async () => {
				applicationManager.isApplicationInstalled = (appId: string) => Promise.resolve(true);
				await assertDoesNotThrow({ shouldStartApplicatinThrow: true });
			});
		});

	});

	describe("reinstallApplication", () => {
		it("calls uninstallApplication with correct arguments", async () => {
			let uninstallApplicationAppIdParam: string;
			applicationManager.uninstallApplication = (appId: string) => {
				uninstallApplicationAppIdParam = appId;
				return Promise.resolve();
			};

			applicationManager.isApplicationInstalled = (appIdentifier: string) => Promise.resolve(true);

			await applicationManager.reinstallApplication("appId", "packageFilePath");
			assert.deepEqual(uninstallApplicationAppIdParam, "appId");
		});

		it("calls installApplication with correct arguments", async () => {
			let installApplicationPackageFilePathParam: string;
			applicationManager.installApplication = (packageFilePath: string) => {
				installApplicationPackageFilePathParam = packageFilePath;
				return Promise.resolve();
			};

			await applicationManager.reinstallApplication("appId", "packageFilePath");
			assert.deepEqual(installApplicationPackageFilePathParam, "packageFilePath");
		});

		it("calls uninstallApplication and installApplication in correct order", async () => {
			let isInstallApplicationCalled = false;
			let isUninstallApplicationCalled = false;

			applicationManager.isApplicationInstalled = (appIdentifier: string) => Promise.resolve(true);

			applicationManager.uninstallApplication = (appId: string) => {
				assert.isFalse(isInstallApplicationCalled, "When uninstallApplication is called, installApplication should not have been called.");
				isUninstallApplicationCalled = true;
				return Promise.resolve();
			};

			applicationManager.installApplication = (packageFilePath: string) => {
				assert.isTrue(isUninstallApplicationCalled, "When installApplication is called, uninstallApplication should have been called.");
				isInstallApplicationCalled = true;
				return Promise.resolve();
			};

			await applicationManager.reinstallApplication("appId", "packageFilePath");

			assert.isTrue(isUninstallApplicationCalled, "uninstallApplication should have been called.");
			assert.isTrue(isInstallApplicationCalled, "installApplication should have been called.");
		});
	});
});
