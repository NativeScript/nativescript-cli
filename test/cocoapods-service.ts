import * as yok from "../lib/common/yok";
import { assert } from "chai";
import { CocoaPodsService } from "../lib/services/cocoapods-service";
import { EOL } from "os";
import * as _ from 'lodash';
import { LoggerStub, ErrorsStub } from "./stubs";
import { XcconfigService } from "../lib/services/xcconfig-service";
import * as path from "path";
import { CocoaPodsPlatformManager } from "../lib/services/cocoapods-platform-manager";

interface IMergePodfileHooksTestCase {
	input: string;
	output: string;
	testCaseDescription: string;
	projectPodfileContent?: string;
	pluginData?: IPluginData;
}

function createTestInjector(): IInjector {
	const testInjector: IInjector = new yok.Yok();

	testInjector.register("fs", {});
	testInjector.register("cocoapodsService", CocoaPodsService);
	testInjector.register("childProcess", {});
	testInjector.register("errors", ErrorsStub);
	testInjector.register("xcprojService", {});
	testInjector.register("logger", LoggerStub);
	testInjector.register("config", {});
	testInjector.register("xcconfigService", XcconfigService);
	testInjector.register("projectData", ({}));
	testInjector.register("cocoaPodsPlatformManager", CocoaPodsPlatformManager);

	return testInjector;
}

// The newline characters should be replaced with EOL because on Windows the EOL is \r\n
// but the character which is placed in `` for newline is only \n
// if we do not replace the newline characters the tests will pass only on linux and mac.
function changeNewLineCharacter(input: string): string {
	return input ? input.replace(/\r?\n/g, EOL) : input;
}

describe("Cocoapods service", () => {
	if (require("os").platform() === "win32") {
		console.log("Skipping 'Cocoapods service' tests. They can work only on macOS and Linux");
		return;
	}
	const nativeProjectPath = "nativeProjectPath";
	const mockPluginData: any = {
		name: "plugin1",
		pluginPlatformsFolderPath: () => "pluginPlatformsFolderPath"
	};
	const mockProjectData: any = {
		projectDir: "projectDir",
		projectName: "projectName",
		appResourcesDirectoryPath: "my/full/path/to/app/App_Resources",
		nsConfig: {
			overridePods: false
		}
	};

	const mockPlatformData: any = {
		projectRoot: "nativeProjectRoot",
		normalizedPlatformName: "iOS"
	};

	let testInjector: IInjector;
	let cocoapodsService: ICocoaPodsService;
	let newPodfileContent = "";

	const mockFileSystem = (injector: IInjector, podfileContent: string, projectPodfileContent?: string, appResourcesPodfileContent?: string): void => {
		const fs: IFileSystem = injector.resolve("fs");

		fs.exists = () => true;
		fs.readText = (file: string) => {
			if (file.indexOf("pluginPlatformsFolderPath") !== -1) {
				return podfileContent;
			}

			if (file.indexOf("App_Resources") !== -1) {
				return appResourcesPodfileContent;
			}

			return newPodfileContent || projectPodfileContent || "";
		};

		fs.writeFile = (pathToFile: string, content: any) => {
			newPodfileContent = content;
		};

		fs.deleteFile = (pathToFile: string): void => {
			newPodfileContent = null;
			projectPodfileContent = null;
		};
	};

	beforeEach(() => {
		testInjector = createTestInjector();
		cocoapodsService = testInjector.resolve("cocoapodsService");
		newPodfileContent = "";
	});

	describe("merges Podfile files correctly", () => {
		const testCases: IMergePodfileHooksTestCase[] = [
			{
				testCaseDescription: "adds plugin's Podfile to project's one",
				input: `
pod 'GoogleAnalytics', '~> 3.1'
`,
				output: `use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile

pod 'GoogleAnalytics', '~> 3.1'

# End Podfile
end`,
				projectPodfileContent: ""
			},
			{
				testCaseDescription: "replaces correctly special chars from plugin's name",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_with_special_symbols_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_with_special_symbols_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: "",
				pluginData: <any>{
					name: "plugin1-with-special-symbols",
					pluginPlatformsFolderPath: () => "pluginPlatformsFolderPath"
				}
			},
			{
				testCaseDescription: "replaces correctly special chars from plugin's name when plugin has _",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_with_special_symbols___and___underscore_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_with_special_symbols___and___underscore_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: "",
				pluginData: <any>{
					name: "plugin1-with-special-symbols_and_underscore",
					pluginPlatformsFolderPath: () => "pluginPlatformsFolderPath"
				}
			},
			{
				testCaseDescription: "treats plugin1_plugin and plugin1___plugin as the same plugin (by design as we do not expect plugins to have names with three underscores)",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1___plugin_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
end

def post_installplugin1___plugin_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1___plugin_0 installer
end
# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'OCMock', '~> 2.0.1'
end

def post_installplugin1___plugin_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				pluginData: <any>{
					name: "plugin1_plugin",
					pluginPlatformsFolderPath: () => "pluginPlatformsFolderPath"
				}
			},
			{
				testCaseDescription: "replaces the plugin's old Podfile with the new one inside project's Podfile",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
	post_installplugin1_0 installer
end
# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 2.1' # version changed here
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
			},
			{
				testCaseDescription: "adds plugin with postinstall when project's Podfile has content, but does not have postinstall",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
# Begin Podfile - secondPluginPlatformsFolderPath/Podfile
pod 'OCMock', '~> 2.0.1'
# End Podfile

post_install do |installer|
  post_installplugin1_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
# Begin Podfile - secondPluginPlatformsFolderPath/Podfile
pod 'OCMock', '~> 2.0.1'
# End Podfile
end`,
			},
			{
				testCaseDescription: "merges more than one hooks with block parameter correctly.",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_0 installer
  post_installplugin1_1 installer
  post_installplugin1_2 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_installplugin1_1 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_installplugin1_2 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
			},
			{
				testCaseDescription: "merges more than one hooks with and without block parameter correctly",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end

	post_install do |installer_representation|
		installer_representation.pods_project.targets.each do |target|
			puts target.name
		end
	end
	post_install do
		puts "Hello World!"
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_0 installer
  post_installplugin1_1
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end

	def post_installplugin1_0 (installer_representation)
		installer_representation.pods_project.targets.each do |target|
			puts target.name
		end
	end
	def post_installplugin1_1
		puts "Hello World!"
	end
end
# End Podfile
end`,
			},
			{
				testCaseDescription: "should not change the Podfile when the plugin content is already part of the project",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: "",
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
  post_installplugin1_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
			}
		];

		_.each(testCases, (testCase: IMergePodfileHooksTestCase) => {
			it(testCase.testCaseDescription, async () => {
				mockFileSystem(testInjector, testCase.input, testCase.projectPodfileContent);

				await cocoapodsService.applyPodfileToProject(testCase.pluginData ? testCase.pluginData.name : mockPluginData.name, cocoapodsService.getPluginPodfilePath(testCase.pluginData || mockPluginData), mockProjectData, mockPlatformData);

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.output));
			});
		});
	});

	describe("removes plugin's Podfile correctly", () => {
		const testCases: IMergePodfileHooksTestCase[] = [
			{
				testCaseDescription: "removes plugin's Podfile from project's one and deletes project's Podfile as nothing is left there",
				input: `
pod 'GoogleAnalytics', '~> 3.1'
`,
				output: null,
				projectPodfileContent: `use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile

pod 'GoogleAnalytics', '~> 3.1'

# End Podfile

end`
			},
			{
				testCaseDescription: "removes plugin's Podfile (with hook) from project's one and deletes project's Podfile as nothing is left there",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: null,
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
post_installplugin1_0 installer
end
# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`
			},
			{
				testCaseDescription: "removes Podfile which has several postinstall hooks and deletes project's Podfile as nothing is left there",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: null,
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
	post_installplugin1_0 installer
	post_installplugin1_1 installer
	post_installplugin1_2 installer
end
# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_installplugin1_1 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_installplugin1_2 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`
			},
			{
				testCaseDescription: "removes plugin's Podfile (with hook) from project's one when there are other plugins with hooks in the project Podfile",
				input: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

post_install do |installer|
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end`,
				output: `use_frameworks!

target "projectName" do
post_install do |installer|
	post_installplugin2_0 installer
end

# Begin Podfile - pluginPlatformsFolderPath1/Podfile

pod 'Firebase', '~> 3.1'

def post_installplugin2_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
post_install do |installer|
	post_installplugin1_0 installer
	post_installplugin2_0 installer
end
# Begin Podfile - pluginPlatformsFolderPath/Podfile

target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_installplugin1_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile

# Begin Podfile - pluginPlatformsFolderPath1/Podfile

pod 'Firebase', '~> 3.1'

def post_installplugin2_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile
end`
			}
		];

		_.each(testCases, (testCase: IMergePodfileHooksTestCase) => {
			it(testCase.testCaseDescription, async () => {
				mockFileSystem(testInjector, testCase.input, testCase.projectPodfileContent);

				cocoapodsService.removePodfileFromProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), mockProjectData, nativeProjectPath);

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.output));
			});
		});
	});

	describe("executePodInstall", () => {
		const projectRoot = "nativeProjectRoot";
		const xcodeProjPath = "xcodeProjectPath";

		beforeEach(() => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => null;
			childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => ({
				stdout: "",
				stderr: "",
				exitCode: 0
			});
		});

		["pod", "sandbox-pod"].forEach(podExecutable => {
			it(`uses ${podExecutable} executable when USE_POD_SANDBOX is ${podExecutable === "sandbox-pod"}`, async () => {
				const config = testInjector.resolve<IConfiguration>("config");
				config.USE_POD_SANDBOX = podExecutable === "sandbox-pod";
				const childProcess = testInjector.resolve<IChildProcess>("childProcess");
				let commandCalled = "";
				childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
					commandCalled = command;
					return {
						stdout: "",
						stderr: "",
						exitCode: 0
					};
				};

				await cocoapodsService.executePodInstall(projectRoot, xcodeProjPath);
				assert.equal(commandCalled, podExecutable);
			});
		});

		it("calls pod install spawnFromEvent with correct arguments", async () => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			let commandCalled = "";
			childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				commandCalled = command;
				assert.deepEqual(args, ["install"]);
				assert.equal(event, "close");
				assert.deepEqual(options, { cwd: projectRoot, stdio: ['pipe', process.stdout, process.stdout] });
				assert.deepEqual(spawnFromEventOptions, { throwError: false });
				return {
					stdout: "",
					stderr: "",
					exitCode: 0
				};
			};

			await cocoapodsService.executePodInstall(projectRoot, xcodeProjPath);
			assert.equal(commandCalled, "pod");
		});

		it("fails when pod install exits with code that is not 0", async () => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				return {
					stdout: "",
					stderr: "",
					exitCode: 1
				};
			};

			await assert.isRejected(cocoapodsService.executePodInstall(projectRoot, xcodeProjPath), "'pod install' command failed.");
		});

		it("returns the result of the pod install spawnFromEvent method", async () => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			const expectedResult = {
				stdout: "pod install finished",
				stderr: "",
				exitCode: 0
			};
			childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				return expectedResult;
			};

			const result = await cocoapodsService.executePodInstall(projectRoot, xcodeProjPath);
			assert.deepEqual(result, expectedResult);
		});
	});

	describe("remove duplicated platfoms from project podfile", () => {
		const projectRoot = "my/project/platforms/ios";
		const projectPodfilePath = path.join(projectRoot, "testProjectPodfilePath");
		let projectPodfileContent = "";

		beforeEach(() => {
			cocoapodsService.getProjectPodfilePath = () => projectPodfilePath;
			projectPodfileContent = "";
		});

		function setupMocks(pods: any[]): { projectData: IProjectData, platformData: any } {
			const podsPaths = pods.map(p => p.path);
			const projectData = testInjector.resolve("projectData");
			projectData.getAppResourcesDirectoryPath = () => "my/full/path/to/app/App_Resources";
			projectData.appResourcesDirectoryPath = "my/full/path/to/app/App_Resources";
			projectData.projectName = "projectName";
			projectData.nsConfig = {
				overridePods: false
			};

			const fs = testInjector.resolve("fs");
			fs.exists = (filePath: string) => projectPodfilePath === filePath || _.includes(podsPaths, filePath);
			fs.readText = (filePath: string) => {
				if (filePath === projectPodfilePath) {
					return projectPodfileContent;
				}

				const pod = _.find(pods, p => p.path === filePath);
				if (pod) {
					return pod.content;
				}
			};
			fs.writeFile = (filePath: string, fileContent: string) => {
				if (filePath === projectPodfilePath) {
					projectPodfileContent = fileContent;
				}
			};
			fs.deleteFile = () => ({});

			const platformData = { normalizedPlatformName: "iOS", projectRoot };

			return { projectData, platformData };
		}

		const testCasesWithApplyAndRemove = [
			{
				name: "should select the podfile with highest platform after Podfile from App_Resources has been deleted",
				pods: [{
					name: "mySecondPluginWithPlatform",
					path: "node_modules/  mypath  with spaces/mySecondPluginWithPlatform/Podfile",
					content: `platform :ios, '10.0'`
				}, {
					name: "myPluginWithoutPlatform",
					path: "node_modules/myPluginWithoutPlatform/Podfile",
					content: `pod 'myPod' ~> 0.3.4`
				}, {
					name: "myFirstPluginWithPlatform",
					path: "node_modules/myFirstPluginWithPlatform/Podfile",
					content: `platform :ios, '11.0'`
				}, {
					name: "App_Resources",
					path: "my/full/path/to/app/App_Resources/iOS/Podfile",
					content: `platform :ios, '8.0'`
				}],
				podsToRemove: [{
					name: "NSPodfileBase",
					path: "my/full/path/to/app/App_Resources/iOS/Podfile"
				}],
				expectedProjectPodfileContentAfterApply: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection my/full/path/to/app/App_Resources/iOS/Podfile with 8.0
platform :ios, '8.0'
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/  mypath  with spaces/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios, '11.0'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
# platform :ios, '8.0'
# End Podfile
end`,
				expectedProjectPodfileContentAfterRemove: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection node_modules/myFirstPluginWithPlatform/Podfile with 11.0
platform :ios, '11.0'
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/  mypath  with spaces/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios, '11.0'
# End Podfile

end`
			}
		];

		_.each(testCasesWithApplyAndRemove, testCase => {
			it(testCase.name, async () => {
				const { projectData, platformData } = setupMocks(testCase.pods);

				for (const pod of testCase.pods) {
					await cocoapodsService.applyPodfileToProject(pod.name, pod.path, projectData, platformData);
				}

				assert.deepEqual(projectPodfileContent, testCase.expectedProjectPodfileContentAfterApply);

				for (const pod of testCase.podsToRemove) {
					await cocoapodsService.removePodfileFromProject(pod.name, pod.path, projectData, projectPodfilePath);
				}

				assert.deepEqual(projectPodfileContent, testCase.expectedProjectPodfileContentAfterRemove);
			});
		});

		const testCases = [
			{
				name: "should not change the Podfile when no platform",
				pods: [{
					name: 'plugin1',
					path: 'path/to/my/plugin1/platforms/ios/Podfile',
					content: `pod 'Firebase', '~> 3.1'`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# Begin Podfile - path/to/my/plugin1/platforms/ios/Podfile
pod 'Firebase', '~> 3.1'
# End Podfile
end`
			},
			{
				name: "should not change the Podfile when there is only one platform",
				pods: [{
					name: 'plugin2',
					path: 'path/to/my/plugin2/platforms/ios/Podfile',
					content: `platform :ios, '9.0'`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection path/to/my/plugin2/platforms/ios/Podfile with 9.0
platform :ios, '9.0'
# End NativeScriptPlatformSection

# Begin Podfile - path/to/my/plugin2/platforms/ios/Podfile
# platform :ios, '9.0'
# End Podfile
end`
			},
			{
				name: "should select the platform from Podfile in App_Resources",
				pods: [{
					name: 'plugin1',
					path: 'my/full/path/to/plugin1/platforms/ios/Podfile',
					content: `platform :ios, '10.0'`
				}, {
					name: 'plugin2',
					path: 'my/full/path/to/plugin2/platforms/ios/Podfile',
					content: `pod 'myPod' ~> 0.3.4`
				}, {
					name: 'App_Resources',
					path: 'my/full/path/to/app/App_Resources/iOS/Podfile',
					content: `platform :ios, '9.0'`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection my/full/path/to/app/App_Resources/iOS/Podfile with 9.0
platform :ios, '9.0'
# End NativeScriptPlatformSection

# Begin Podfile - my/full/path/to/plugin1/platforms/ios/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - my/full/path/to/plugin2/platforms/ios/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
# platform :ios, '9.0'
# End Podfile
end`
			},
			{
				name: "should select the platform with highest version from plugins when no Podfile in App_Resources",
				pods: [{
					name: 'pluginWithPlatform',
					path: 'node_modules/myFirstPluginWithPlatform/Podfile',
					content: `platform :ios, '9.0'`
				}, {
					name: 'mySecondPluginWithPlatform',
					path: 'node_modules/mySecondPluginWithPlatform/Podfile',
					content: `platform :ios, '10.0'`
				}, {
					name: 'myPluginWithoutPlatform',
					path: 'node_modules/myPluginWithoutPlatform/Podfile',
					content: `pod 'myPod' ~> 0.3.4`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection node_modules/mySecondPluginWithPlatform/Podfile with 10.0
platform :ios, '10.0'
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios, '9.0'
# End Podfile

# Begin Podfile - node_modules/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile
end`
			},
			{
				name: "should select the platform without version when no Podfile in App_Resources",
				pods: [{
					name: 'myPluginWithoutPlatform',
					path: 'node_modules/myPluginWithoutPlatform/Podfile',
					content: `pod 'myPod' ~> 0.3.4`
				}, {
					name: 'mySecondPluginWithPlatform',
					path: 'node_modules/mySecondPluginWithPlatform/Podfile',
					content: `platform :ios, '10.0'`
				}, {
					name: 'myFirstPluginWithPlatform',
					path: 'node_modules/myFirstPluginWithPlatform/Podfile',
					content: `platform :ios`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# NativeScriptPlatformSection node_modules/myFirstPluginWithPlatform/Podfile with
platform :ios
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios
# End Podfile
end`
			},
			{
				name: "shouldn't replace the platform without version when no Podfile in App_Resources",
				pods: [{
					name: 'myPluginWithoutPlatform',
					path: 'node_modules/myPluginWithoutPlatform/Podfile',
					content: `pod 'myPod' ~> 0.3.4`
				}, {
					name: 'myFirstPluginWithPlatform',
					path: 'node_modules/myFirstPluginWithPlatform/Podfile',
					content: `platform :ios`
				}, {
					name: 'mySecondPluginWithPlatform',
					path: 'node_modules/mySecondPluginWithPlatform/Podfile',
					content: `platform :ios, '10.0'`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# NativeScriptPlatformSection node_modules/myFirstPluginWithPlatform/Podfile with
platform :ios
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios
# End Podfile

# Begin Podfile - node_modules/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile
end`
			},
			{
				name: "should select platform from plugins when the podfile in App_Resources/iOS/Podfile has no platform",
				pods: [{
					name: "mySecondPluginWithPlatform",
					path: "node_modules/  mypath  with spaces/mySecondPluginWithPlatform/Podfile",
					content: `platform :ios, '10.0'`
				}, {
					name: "myPluginWithoutPlatform",
					path: "node_modules/myPluginWithoutPlatform/Podfile",
					content: `pod 'myPod' ~> 0.3.4`
				}, {
					name: "myFirstPluginWithPlatform",
					path: "node_modules/myFirstPluginWithPlatform/Podfile",
					content: `platform :ios, '11.0'`
				}, {
					name: "App_Resources",
					path: "my/full/path/to/app/App_Resources/iOS/Podfile",
					content: `pod: 'mySecondPlatformPod' ~> 2.0.0${EOL}pod: 'platformKit' ~> 1.0`
				}],
				expectedProjectPodfileContent: `use_frameworks!

target "projectName" do
# NativeScriptPlatformSection node_modules/myFirstPluginWithPlatform/Podfile with 11.0
platform :ios, '11.0'
# End NativeScriptPlatformSection

# Begin Podfile - node_modules/  mypath  with spaces/mySecondPluginWithPlatform/Podfile
# platform :ios, '10.0'
# End Podfile

# Begin Podfile - node_modules/myPluginWithoutPlatform/Podfile
pod 'myPod' ~> 0.3.4
# End Podfile

# Begin Podfile - node_modules/myFirstPluginWithPlatform/Podfile
# platform :ios, '11.0'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod: 'mySecondPlatformPod' ~> 2.0.0
pod: 'platformKit' ~> 1.0
# End Podfile
end`
			}
		];

		_.each(testCases, testCase => {
			it(testCase.name, async () => {
				const { projectData, platformData } = setupMocks(testCase.pods);
				cocoapodsService.removePodfileFromProject = () => ({});

				for (const pod of testCase.pods) {
					await cocoapodsService.applyPodfileToProject(pod.name, pod.path, projectData, platformData);
				}

				assert.deepEqual(projectPodfileContent, testCase.expectedProjectPodfileContent);
			});
		});
	});

	describe("override pods", () => {

		it("should override pods", async () => {
			const projectDataMock = _.assign({}, mockProjectData, {nsConfig: {
				overridePods: true
			}});

			const testCase = {
				pluginPodContent: `pod 'MaterialComponents/Tabs', '< 84.4'`,
				appResourcesPodContent: `pod 'MaterialComponents/Tabs', '~> 84.4'`,
				projectPodfileContent: "",
				expectedOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
#pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile
end`,
			expectedFinalOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
#pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod 'MaterialComponents/Tabs', '~> 84.4'
# End Podfile
end`
			};

			mockFileSystem(testInjector, testCase.pluginPodContent, testCase.projectPodfileContent, testCase.appResourcesPodContent);
			await cocoapodsService.applyPodfileToProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), projectDataMock, mockPlatformData);

			assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedOutput));
			await cocoapodsService.applyPodfileFromAppResources(projectDataMock, mockPlatformData);

			assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedFinalOutput));
		});

		it("should override pods and undo if app resources podfile doesn't include the pod", async () => {
		const testCase = {
			pluginPodContent: `pod 'MaterialComponents/Tabs', '< 84.4'`,
			appResourcesPodContent:
`pod 'MaterialComponents/Tabs', '~> 84.4'
pod 'Mapbox-iOS-SDK', '~> 4.4.1'`,
			updatedAppResourcesPodContent:`pod 'Mapbox-iOS-SDK', '~> 4.4.1'`,
			projectPodfileContent: "",
			expectedOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
#pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile
end`,
			expectedIntermidiatOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
#pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod 'MaterialComponents/Tabs', '~> 84.4'
pod 'Mapbox-iOS-SDK', '~> 4.4.1'
# End Podfile
end`,
			expectedFinalOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod 'Mapbox-iOS-SDK', '~> 4.4.1'
# End Podfile
end`
		};
			const projectDataMock = _.assign({}, mockProjectData, {nsConfig: {
				overridePods: true
			}});

			mockFileSystem(testInjector, testCase.pluginPodContent, testCase.projectPodfileContent, testCase.appResourcesPodContent);
			await cocoapodsService.applyPodfileToProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), projectDataMock, mockPlatformData);

			assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedOutput));
			await cocoapodsService.applyPodfileFromAppResources(projectDataMock, mockPlatformData);

			assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedIntermidiatOutput));

			mockFileSystem(testInjector, testCase.pluginPodContent, testCase.projectPodfileContent, testCase.updatedAppResourcesPodContent);
			await cocoapodsService.applyPodfileToProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), projectDataMock, mockPlatformData);
			await cocoapodsService.applyPodfileFromAppResources(projectDataMock, mockPlatformData);

			assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedFinalOutput));
		});

		it("should not override if not in app resources podfile and the override when added", async () => {
			const testCase = {
				pluginPodContent: `pod 'MaterialComponents/Tabs', '< 84.4'`,
				appResourcesPodContent: `pod 'Mapbox-iOS-SDK', '~> 4.4.1'`,
				updatedAppResourcesPodContent:
`pod 'MaterialComponents/Tabs', '~> 84.4'
pod 'Mapbox-iOS-SDK', '~> 4.4.1'`,
				projectPodfileContent: "",
				expectedOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile
end`,
				expectedIntermidiatOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod 'Mapbox-iOS-SDK', '~> 4.4.1'
# End Podfile
end`,
				expectedFinalOutput:
`use_frameworks!

target "projectName" do
# Begin Podfile - pluginPlatformsFolderPath/Podfile
#pod 'MaterialComponents/Tabs', '< 84.4'
# End Podfile

# Begin Podfile - my/full/path/to/app/App_Resources/iOS/Podfile
pod 'MaterialComponents/Tabs', '~> 84.4'
pod 'Mapbox-iOS-SDK', '~> 4.4.1'
# End Podfile
end`
			};
				const projectDataMock = _.assign({}, mockProjectData, {nsConfig: {
					overridePods: true
				}});

				mockFileSystem(testInjector, testCase.pluginPodContent, testCase.projectPodfileContent, testCase.appResourcesPodContent);
				await cocoapodsService.applyPodfileToProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), projectDataMock, mockPlatformData);

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedOutput));
				await cocoapodsService.applyPodfileFromAppResources(projectDataMock, mockPlatformData);

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedIntermidiatOutput));

				mockFileSystem(testInjector, testCase.pluginPodContent, testCase.projectPodfileContent, testCase.updatedAppResourcesPodContent);
				await cocoapodsService.applyPodfileToProject(mockPluginData.name, cocoapodsService.getPluginPodfilePath(mockPluginData), projectDataMock, mockPlatformData);
				await cocoapodsService.applyPodfileFromAppResources(projectDataMock, mockPlatformData);

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.expectedFinalOutput));
			});
	});
});
