import * as yok from "../lib/common/yok";
import { assert } from "chai";
import { CocoaPodsService } from "../lib/services/cocoapods-service";
import { EOL } from "os";
import { LoggerStub, ErrorsStub } from "./stubs";

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

	return testInjector;
}

// The newline characters should be replaced with EOL because on Windows the EOL is \r\n
// but the character which is placed in `` for newline is only \n
// if we do not replace the newline characters the tests will pass only on linux and mac.
function changeNewLineCharacter(input: string): string {
	return input ? input.replace(/\r?\n/g, EOL) : input;
}

describe("Cocoapods service", () => {
	const nativeProjectPath = "nativeProjectPath";
	const mockPluginData: any = {
		name: "plugin1",
		pluginPlatformsFolderPath: () => "pluginPlatformsFolderPath"
	};
	const mockProjectData: any = {
		projectDir: "projectDir",
		projectName: "projectName"
	};

	let testInjector: IInjector;
	let cocoapodsService: ICocoaPodsService;
	let newPodfileContent = "";

	const mockFileSystem = (injector: IInjector, podfileContent: string, projectPodfileContent?: string): void => {
		const fs: IFileSystem = injector.resolve("fs");

		fs.exists = () => true;
		fs.readText = (file: string) => {
			if (file.indexOf("pluginPlatformsFolderPath") !== -1) {
				return podfileContent;
			}

			return newPodfileContent || projectPodfileContent || "";
		};

		fs.writeFile = (pathToFile: string, content: any) => {
			newPodfileContent = content;
		};

		fs.deleteFile = (path: string): void => {
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

post_install do |installer|
  post_installplugin1_with_special_symbols_0 installer
end
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

post_install do |installer|
  post_installplugin1_with_special_symbols___and___underscore_0 installer
end
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

post_install do |installer|
  post_installplugin1___plugin_0 installer
end
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
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

post_install do |installer|
  post_installplugin1___plugin_0 installer
end
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

post_install do |installer|
  post_installplugin1_0 installer
end
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
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

post_install do |installer|
	post_installplugin1_0 installer
end
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

post_install do |installer|
  post_installplugin1_0 installer
  post_installplugin1_1 installer
  post_installplugin1_2 installer
end
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

post_install do |installer|
  post_installplugin1_0 installer
  post_installplugin1_1
end
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

post_install do |installer|
  post_installplugin1_0 installer
end
end`,
			}
		];

		_.each(testCases, (testCase: IMergePodfileHooksTestCase) => {
			it(testCase.testCaseDescription, async () => {
				mockFileSystem(testInjector, testCase.input, testCase.projectPodfileContent);

				await cocoapodsService.applyPluginPodfileToProject(testCase.pluginData || mockPluginData, mockProjectData, nativeProjectPath);

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

post_install do |installer|
post_installplugin1_0 installer
end
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

post_install do |installer|
	post_installplugin1_0 installer
	post_installplugin1_1 installer
	post_installplugin1_2 installer
end
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

# Begin Podfile - pluginPlatformsFolderPath1/Podfile

pod 'Firebase', '~> 3.1'

def post_installplugin2_0 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
# End Podfile

post_install do |installer|
post_installplugin2_0 installer
end
end`,
				projectPodfileContent: `use_frameworks!

target "projectName" do
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

post_install do |installer|
post_installplugin1_0 installer
post_installplugin2_0 installer
end
end`
			}
		];

		_.each(testCases, (testCase: IMergePodfileHooksTestCase) => {
			it(testCase.testCaseDescription, async () => {
				mockFileSystem(testInjector, testCase.input, testCase.projectPodfileContent);

				cocoapodsService.removePluginPodfileFromProject(mockPluginData, mockProjectData, nativeProjectPath);

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

			const xcprojService = testInjector.resolve<IXcprojService>("xcprojService");
			xcprojService.verifyXcproj = async (opts: IVerifyXcprojOptions): Promise<boolean> => false;
			xcprojService.getXcprojInfo = async (): Promise<IXcprojInfo> => (<any>{});
		});

		it("fails when pod executable is not found", async () => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				assert.equal(command, "which pod");
				throw new Error("Missing pod executable");
			};

			await assert.isRejected(cocoapodsService.executePodInstall(projectRoot, xcodeProjPath), "CocoaPods or ruby gem 'xcodeproj' is not installed. Run `sudo gem install cocoapods` and try again.");
		});

		it("fails when xcodeproj executable is not found", async () => {
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.exec = async (command: string, options?: any, execOptions?: IExecOptions): Promise<any> => {
				if (command === "which pod") {
					return;
				}

				assert.equal(command, "which xcodeproj");
				throw new Error("Missing xcodeproj executable");

			};

			await assert.isRejected(cocoapodsService.executePodInstall(projectRoot, xcodeProjPath), "CocoaPods or ruby gem 'xcodeproj' is not installed. Run `sudo gem install cocoapods` and try again.");
		});

		it("fails with correct error when xcprojService.verifyXcproj throws", async () => {
			const expectedError = new Error("err");
			const xcprojService = testInjector.resolve<IXcprojService>("xcprojService");
			xcprojService.verifyXcproj = async (opts: IVerifyXcprojOptions): Promise<boolean> => {
				throw expectedError;
			};

			await assert.isRejected(cocoapodsService.executePodInstall(projectRoot, xcodeProjPath), expectedError);
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

		it("calls xcprojService.verifyXcproj with correct arguments", async () => {
			const xcprojService = testInjector.resolve<IXcprojService>("xcprojService");
			let optsPassedToVerifyXcproj: any = null;
			xcprojService.verifyXcproj = async (opts: IVerifyXcprojOptions): Promise<boolean> => {
				optsPassedToVerifyXcproj = opts;
				return false;
			};

			await cocoapodsService.executePodInstall(projectRoot, xcodeProjPath);
			assert.deepEqual(optsPassedToVerifyXcproj, { shouldFail: true });
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

		it("returns the result of the pod install spawnFromEvent methdo", async () => {
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

		it("executes xcproj command with correct arguments when is true", async () => {
			const xcprojService = testInjector.resolve<IXcprojService>("xcprojService");
			xcprojService.getXcprojInfo = async (): Promise<IXcprojInfo> => (<any>{
				shouldUseXcproj: true
			});

			const spawnFromEventCalls: any[] = [];
			const childProcess = testInjector.resolve<IChildProcess>("childProcess");
			childProcess.spawnFromEvent = async (command: string, args: string[], event: string, options?: any, spawnFromEventOptions?: ISpawnFromEventOptions): Promise<ISpawnResult> => {
				spawnFromEventCalls.push({
					command,
					args,
					event,
					options,
					spawnFromEventOptions
				});
				return {
					stdout: "",
					stderr: "",
					exitCode: 0
				};
			};

			await cocoapodsService.executePodInstall(projectRoot, xcodeProjPath);
			assert.deepEqual(spawnFromEventCalls, [
				{
					command: "pod",
					args: ["install"],
					event: "close",
					options: { cwd: projectRoot, stdio: ['pipe', process.stdout, process.stdout] },
					spawnFromEventOptions: { throwError: false }
				},
				{
					command: "xcproj",
					args: ["--project", xcodeProjPath, "touch"],
					event: "close",
					options: undefined,
					spawnFromEventOptions: undefined
				}
			]);

		});
	});
});
