import * as yok from "../lib/common/yok";
import {assert} from "chai";
import {CocoaPodsService} from "../lib/services/cocoapods-service";
import {EOL} from "os";

interface IMergePodfileHooksTestCase {
	input: string;
	output: string;
	testCaseDescription: string;
}

function createTestInjector(): IInjector {
	let testInjector: IInjector = new yok.Yok();

	testInjector.register("fs", {});
	testInjector.register("cocoapodsService", CocoaPodsService);

	return testInjector;
}

// The newline characters should be replaced with EOL because on Windows the EOL is \r\n
// but the character which is placed in `` for newline is only \n
// if we do not replace the newline characters the tests will pass only on linux and mac.
function changeNewLineCharacter(input: string): string {
	return input ? input.replace(/\r?\n/g, EOL) : input;
}

describe("Cocoapods service", () => {
	describe("merge Podfile hooks", () => {
		let testInjector: IInjector;
		let cocoapodsService: ICocoaPodsService;
		let newPodfileContent: string;

		let mockFileSystem = (injector: IInjector, podfileContent: string): void => {
			let fs: IFileSystem = injector.resolve("fs");

			fs.exists = () => true;
			fs.readText = () => podfileContent;
			fs.writeFile = (pathToFile: string, content: any) => {
				newPodfileContent = content;
			};
		};

		let testCaces: IMergePodfileHooksTestCase[] = [
			{
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
				output: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end
end

def post_install1 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_install2 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
def post_install3 (installer)
	installer.pods_project.targets.each do |target|
		puts target.name
	end
end
post_install do |installer|
  post_install1 installer
  post_install2 installer
  post_install3 installer
end`,
				testCaseDescription: "should merge more than one hooks with block parameter correctly."
			}, {
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
				output: `
target 'MyApp' do
	pod 'GoogleAnalytics', '~> 3.1'
	target 'MyAppTests' do
		inherit! :search_paths
			pod 'OCMock', '~> 2.0.1'
		end

	def post_install1 (installer_representation)
		installer_representation.pods_project.targets.each do |target|
			puts target.name
		end
	end
	def post_install2
		puts "Hello World!"
	end
end
post_install do |installer|
  post_install1 installer
  post_install2
end`,
				testCaseDescription: "should merge more than one hooks with and without block parameter correctly."
			}, {
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
				testCaseDescription: "should not change the Podfile when there is only one hook."
			}
		];

		beforeEach(() => {
			testInjector = createTestInjector();
			cocoapodsService = testInjector.resolve("cocoapodsService");
			newPodfileContent = null;
		});

		_.each(testCaces, (testCase: IMergePodfileHooksTestCase) => {
			it(testCase.testCaseDescription, () => {
				mockFileSystem(testInjector, testCase.input);

				cocoapodsService.mergePodfileHookContent("post_install", "");

				assert.deepEqual(changeNewLineCharacter(newPodfileContent), changeNewLineCharacter(testCase.output));
			});
		});
	});
});
