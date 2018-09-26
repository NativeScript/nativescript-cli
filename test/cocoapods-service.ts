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
});
