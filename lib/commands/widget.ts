import { IProjectConfigService, IProjectData } from "../definitions/project";
import * as fs from "fs";
import * as prompts from "prompts";
import { ICommandParameter, ICommand } from "../common/definitions/commands";
import { IErrors } from "../common/declarations";
import * as path from "path";
import * as plist from "plist";
import { injector } from "../common/yok";
import { capitalizeFirstLetter } from "../common/utils";
import { EOL } from "os";
import { SupportedConfigValues } from "../tools/config-manipulation/config-transformer";

export class WidgetCommand implements ICommand {
	public allowedParameters: ICommandParameter[] = [];

	constructor(
		protected $projectData: IProjectData,
		protected $projectConfigService: IProjectConfigService,
		protected $logger: ILogger,
		protected $errors: IErrors
	) {
		this.$projectData.initializeProjectData();
	}

	public async execute(args: string[]): Promise<void> {
		this.failWithUsage();

		return Promise.resolve();
	}

	protected failWithUsage(): void {
		this.$errors.failWithHelp("Usage: ns widget ios");
	}
	public async canExecute(args: string[]): Promise<boolean> {
		this.failWithUsage();
		return false;
	}

	protected getIosSourcePathBase() {
		const resources = this.$projectData.getAppResourcesDirectoryPath();
		return path.join(resources, "iOS", "src");
	}
}
export class WidgetIOSCommand extends WidgetCommand {
	constructor(
		$projectData: IProjectData,
		$projectConfigService: IProjectConfigService,
		$logger: ILogger,
		$errors: IErrors
	) {
		super($projectData, $projectConfigService, $logger, $errors);
	}
	public async canExecute(args: string[]): Promise<boolean> {
		return true;
	}

	public async execute(args: string[]): Promise<void> {
		this.startPrompt(args);
	}

	private async startPrompt(args: string[]) {
		let result = await prompts.prompt({
			type: "text",
			name: "name",
			message: `What name would you like for this widget? (Default is 'widget')`,
		});

		const name = (result.name || "widget").toLowerCase();

		result = await prompts.prompt({
			type: "select",
			name: "value",
			message: `What type of widget would you like? (Request more options: https://github.com/NativeScript/nativescript-cli/issues)`,
			choices: [
				{
					title: "Live Activity",
					description:
						"This will create a Live Activity that will display on the iOS Lock Screen.",
					value: 0,
				},
				{
					title: "Live Activity with Home Screen Widget",
					description:
						"This will create a Live Activity that will display on the iOS Lock Screen with an optional Widget.",
					value: 1,
				},
				{
					title: "Home Screen Widget",
					description: "This will create just a Home Screen Widget.",
					value: 2,
				},
			],
			initial: 1,
		});

		switch (result.value) {
			case 0:
				this.$logger.info("TODO");
				break;
			case 1:
				await this.generateSharedWidgetPackage(
					this.$projectData.projectDir,
					name
				);
				this.generateWidget(this.$projectData.projectDir, name, result.value);
				this.generateAppleUtility(this.$projectData.projectDir, name);
				break;
			case 2:
				this.$logger.info("TODO");
				break;
		}
	}

	private async generateSharedWidgetPackage(projectDir: string, name: string) {
		const sharedWidgetDir = "Shared_Resources/iOS/SharedWidget";
		const sharedWidgetPath = path.join(projectDir, sharedWidgetDir);
		const sharedWidgetSourceDir = "Sources/SharedWidget";
		const sharedWidgetPackagePath = path.join(
			projectDir,
			`${sharedWidgetDir}/Package.swift`
		);
		const sharedWidgetSourcePath = path.join(
			sharedWidgetPath,
			`${sharedWidgetSourceDir}/${capitalizeFirstLetter(name)}Model.swift`
		);
		const gitIgnorePath = path.join(projectDir, ".gitignore");

		if (!fs.existsSync(sharedWidgetPackagePath)) {
			fs.mkdirSync(sharedWidgetPath, { recursive: true });
			fs.mkdirSync(path.join(sharedWidgetPath, sharedWidgetSourceDir), {
				recursive: true,
			});

			let content = `// swift-tools-version:5.9
import PackageDescription

let package = Package(
	name: "SharedWidget",
	platforms: [
		.iOS(.v13)
	],
	products: [
		.library(
			name: "SharedWidget",
			targets: ["SharedWidget"])
	],
	dependencies: [
		// Dependencies declare other packages that this package depends on.
	],
	targets: [
		.target(
			name: "SharedWidget",
			dependencies: []
		)
	]
)${EOL}`;

			fs.writeFileSync(sharedWidgetPackagePath, content);

			content = `import ActivityKit
import WidgetKit

public struct ${capitalizeFirstLetter(name)}Model: ActivityAttributes {
  public typealias DeliveryStatus = ContentState

  public struct ContentState: Codable, Hashable {
    // Dynamic stateful properties about your activity go here!
    public var driverName: String
    public var estimatedDeliveryTime: ClosedRange<Date>

    public init(driverName: String, estimatedDeliveryTime: ClosedRange<Date>) {
      self.driverName = driverName
      self.estimatedDeliveryTime = estimatedDeliveryTime
    }
  }

  // Fixed non-changing properties about your activity go here!
  public var numberOfPizzas: Int
  public var totalAmount: String

  public init(numberOfPizzas: Int, totalAmount: String) {
    self.numberOfPizzas = numberOfPizzas
    self.totalAmount = totalAmount
  }
}${EOL}`;

			fs.writeFileSync(sharedWidgetSourcePath, content);

			// update spm package
			const configData = this.$projectConfigService.readConfig(projectDir);
			if (!configData.ios) {
				configData.ios = {};
			}
			if (!configData.ios.SPMPackages) {
				configData.ios.SPMPackages = [];
			}
			const spmPackages = configData.ios.SPMPackages;
			const sharedWidgetPackage = spmPackages?.find(
				(p) => p.name === "SharedWidget"
			);
			if (!sharedWidgetPackage) {
				spmPackages.push({
					name: "SharedWidget",
					libs: ["SharedWidget"],
					path: "./Shared_Resources/iOS/SharedWidget",
					// @ts-ignore
					targets: [name],
				});
			} else {
				// add target if needed
				if (!sharedWidgetPackage.targets?.includes(name)) {
					sharedWidgetPackage.targets.push(name);
				}
			}

			configData.ios.SPMPackages = spmPackages;
			await this.$projectConfigService.setValue(
				"", // root
				configData as { [key: string]: SupportedConfigValues }
			);

			if (fs.existsSync(gitIgnorePath)) {
				const gitIgnore = fs.readFileSync(gitIgnorePath, {
					encoding: "utf-8",
				});
				const swiftBuildIgnore = `# Swift
.build
.swiftpm`;
				if (gitIgnore.indexOf(swiftBuildIgnore) === -1) {
					content = `${gitIgnore}${EOL}${swiftBuildIgnore}${EOL}`;
					fs.writeFileSync(gitIgnorePath, content);
				}
			}

			console.log(`\nCreated Shared Resources: ${sharedWidgetDir}.\n`);
		}
	}

	private generateWidget(projectDir: string, name: string, type: number): void {
		const appResourcePath = this.$projectData.appResourcesDirectoryPath;
		const capitalName = capitalizeFirstLetter(name);
		const appInfoPlistPath = path.join(appResourcePath, "iOS", "Info.plist");
		const extensionDir = path.join(appResourcePath, "iOS", "extensions");
		const widgetPath = path.join(extensionDir, name);
		const extensionProvisionPath = path.join(extensionDir, `provisioning.json`);
		const extensionsInfoPath = path.join(widgetPath, `Info.plist`);
		const extensionsPrivacyPath = path.join(
			widgetPath,
			`PrivacyInfo.xcprivacy`
		);
		const extensionsConfigPath = path.join(widgetPath, `extension.json`);
		const entitlementsPath = path.join(widgetPath, `${name}.entitlements`);
		const widgetBundlePath = path.join(
			widgetPath,
			`${capitalName}Bundle.swift`
		);
		const widgetHomeScreenPath = path.join(
			widgetPath,
			`${capitalName}HomeScreenWidget.swift`
		);
		const widgetLiveActivityPath = path.join(
			widgetPath,
			`${capitalName}LiveActivity.swift`
		);
		const appIntentPath = path.join(widgetPath, `AppIntent.swift`);
		// const widgetLockScreenControlPath = path.join(
		// 	widgetPath,
		// 	`${capitalName}LockScreenControl.swift`
		// );
		const appEntitlementsPath = path.join(
			appResourcePath,
			"iOS",
			"app.entitlements"
		);

		if (!fs.existsSync(extensionsConfigPath)) {
			fs.mkdirSync(widgetPath, { recursive: true });

			let content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSExtension</key>
	<dict>
		<key>NSExtensionPointIdentifier</key>
		<string>com.apple.widgetkit-extension</string>
	</dict>
</dict>
</plist>${EOL}`;

			fs.writeFileSync(extensionsInfoPath, content);

			content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>NSPrivacyAccessedAPITypes</key>
	<array>
		<dict>
			<key>NSPrivacyAccessedAPIType</key>
			<string>NSPrivacyAccessedAPICategoryUserDefaults</string>
			<key>NSPrivacyAccessedAPITypeReasons</key>
			<array>
				<string>CA92.1</string>
			</array>
		</dict>
	</array>
	<key>NSPrivacyCollectedDataTypes</key>
	<array/>
	<key>NSPrivacyTracking</key>
	<false/>
</dict>
</plist>${EOL}`;

			fs.writeFileSync(extensionsPrivacyPath, content);

			// TODO: can add control (lock screen custom control icon handler) in future
			// ${[1, 2].includes(type) ? capitalName + "LockScreenControl()" : ""}

			content = `import WidgetKit
import SwiftUI

@main
struct ${capitalName}Bundle: WidgetBundle {
	var body: some Widget {
		${[1, 2].includes(type) ? capitalName + "HomeScreenWidget()" : ""}
		${[0, 1].includes(type) ? capitalName + "LiveActivity()" : ""}
	}
}${EOL}`;

			fs.writeFileSync(widgetBundlePath, content);

			content = `import WidgetKit
import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource { "Pizza Delivery" }
    static var description: IntentDescription { "Get up to date delivery details" }

    // An example configurable parameter.
    @Parameter(title: "Favorite Pizza", default: "🍕")
    var favoritePizza: String

    @Parameter(title: "Random", default: "Hello")
    var random: String
}${EOL}`;

			fs.writeFileSync(appIntentPath, content);

			if ([0, 1].includes(type)) {
				content = `import ActivityKit
import SwiftUI
import WidgetKit
import Foundation
import SharedWidget

struct ${capitalName}LiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: ${capitalName}Model.self) { context in
      // Lock screen/banner UI goes here
      ContentView(driver: context.state.driverName)
        .activityBackgroundTint(Color.black)
        .activitySystemActionForegroundColor(Color.white)

    } dynamicIsland: { context in
      DynamicIsland {
        // Expanded UI goes here.  Compose the expanded UI through
        // various regions, like leading/trailing/center/bottom
        DynamicIslandExpandedRegion(.leading) {
            if let timeLeft = timeLeft(range1: Date(), range2: context.state.estimatedDeliveryTime) {
              Image(systemName: "car")
                  .resizable()
                  .scaledToFit()
                  .frame(width: 50, height: 50) // Adjust size
                  .foregroundColor(timeLeft <= 1000 ? Color.green : Color.orange)
            }
        }
        DynamicIslandExpandedRegion(.trailing) {
            if let timeLeft = timeLeft(range1: Date(), range2: context.state.estimatedDeliveryTime) {
                ProgressView(value: timeLeft, total: 3600)
                    .progressViewStyle(.circular)
                    .tint(timeLeft <= 1000 ? Color.green : Color.orange)
            }
        }
        DynamicIslandExpandedRegion(.bottom) {
            if let timeLeft = timeLeft(range1: Date(), range2: context.state.estimatedDeliveryTime) {
                Text("\\(context.state.driverName) \\(timeLeft <= 0 ? "has arrived!" : String(format: "is %.1f min away", timeLeft / 60))")
            }
        }
      } compactLeading: {
        if let timeLeft = timeLeft(range1: Date(), range2: context.state.estimatedDeliveryTime) {
          Image(systemName: "car")
              .resizable()
              .scaledToFit()
              .frame(width: 20, height: 20)
              .foregroundColor(timeLeft <= 0 ? .green : .orange)
        }
      } compactTrailing: {
        if let timeLeft = timeLeft(range1: Date(), range2: context.state.estimatedDeliveryTime) {
          Image(systemName: "timer.circle.fill")
              .resizable()
              .scaledToFit()
              .frame(width: 20, height: 20)
              .foregroundColor(timeLeft <= 0 ? .green : .orange)
        }
      } minimal: {
        Text(context.state.driverName).font(.system(size: 12)) 
      }
      .widgetURL(URL(string: "http://www.apple.com"))
      .keylineTint(Color.red)
    }
  }
    
    func timeLeft(range1: Date, range2: ClosedRange<Date>) -> TimeInterval? {
        let end = min(range1, range2.upperBound)
        
        if end > range1 {
          	let remaining = end.timeIntervalSince(range1)
          	print("Time left: \\(remaining)")
        	return remaining
        } else {
            return 0
        }
    }
}

struct ContentView: View {
  @State var driver = ""

  var body: some View {
	HStack {
      Spacer()
      Image(uiImage: UIImage(named: "pizza-live") ?? UIImage())
      Spacer()
      Text("\\(driver) is on \\(driver == "Sally" ? "her" : "his") way!")
      Spacer()
    }.frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}${EOL}`;

				fs.writeFileSync(widgetLiveActivityPath, content);
			}

			if ([1, 2].includes(type)) {
				content = `import SwiftUI
import WidgetKit

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), random: "Starting", configuration: ConfigurationAppIntent())
    }
    
    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry
    {
        SimpleEntry(date: Date(), random: configuration.random, configuration: configuration)
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<
        SimpleEntry
    > {
        var entries: [SimpleEntry] = []
        
        // Generate a timeline consisting of five entries a second apart, starting from the current time.
        let currentDate = Date()
        for secondOffset in 0..<5 {
            let entryDate = Calendar.current.date(
                byAdding: .second, value: secondOffset, to: currentDate)!
            var config = configuration
            switch (secondOffset) {
            case 1:
                config = .pepperoni
            case 2:
                config = .supreme
            case 3:
                config = .cowboy
            case 4:
                config = .pineswine
            default:
                break;
            }
            let entry = SimpleEntry(date: entryDate, random: config.random, configuration: config)
            entries.append(entry)
        }
        
        return Timeline(entries: entries, policy: .atEnd)
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let random: String
    let configuration: ConfigurationAppIntent
}

struct WidgetView: View {
    var entry: Provider.Entry
    
    var body: some View {
        ZStack {
            Image(uiImage: UIImage(named: "pizza") ?? UIImage()).frame(
                maxWidth: .infinity, maxHeight: .infinity)
            VStack {
                Text("Time:")
                    .foregroundStyle(.white)
                Text(entry.date, style: .time)
                    .foregroundStyle(.white)
                Text("Random City:")
                    .foregroundStyle(.white)
                Text(entry.configuration.random)
                    .foregroundStyle(.white)
                Text("Favorite Pizza:")
                    .foregroundStyle(.white)
                Text(entry.configuration.favoritePizza)
                    .foregroundStyle(.white)
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

@available(iOSApplicationExtension 17.0, *)
struct ${capitalName}HomeScreenWidget: Widget {
    let kind: String = "widget"
    
    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) {
            entry in
            WidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
    }
}

extension ConfigurationAppIntent {
    fileprivate static var pepperoni: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoritePizza = "Pepperoni"
        intent.random = "Georgia"
        return intent
    }
    fileprivate static var supreme: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoritePizza = "Supreme"
        intent.random = "Kansas City"
        return intent
    }
    
    fileprivate static var cowboy: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoritePizza = "Cowboy"
        intent.random = "Nashville"
        return intent
    }
    
    fileprivate static var pineswine: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoritePizza = "Pine & Swine"
        intent.random = "Portland"
        return intent
    }
}

#Preview(as: .systemSmall) {
    ${capitalName}HomeScreenWidget()
} timeline: {
    SimpleEntry(date: .now, random: "Atlanta", configuration: .pepperoni)
    SimpleEntry(date: .now, random: "Austin", configuration: .supreme)
}${EOL}`;
				fs.writeFileSync(widgetHomeScreenPath, content);
			}

			const bundleId = this.$projectConfigService.getValue(`id`, "");
			content = `{
    "${bundleId}.${name}": "{set-your-provision-profile-id}"
}`;

			fs.writeFileSync(extensionProvisionPath, content);

			content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>group.${bundleId}</string>
	</array>
</dict>
</plist>${EOL}`;

			fs.writeFileSync(entitlementsPath, content);

			if (fs.existsSync(appInfoPlistPath)) {
				const appSupportLiveActivity = "NSSupportsLiveActivities";
				const appInfoPlist = plist.parse(
					fs.readFileSync(appInfoPlistPath, {
						encoding: "utf-8",
					})
				) as plist.PlistObject;

				if (!appInfoPlist[appSupportLiveActivity]) {
					// @ts-ignore
					appInfoPlist[appSupportLiveActivity] = true;
					const appPlist = plist.build(appInfoPlist);
					fs.writeFileSync(appInfoPlistPath, appPlist);
				}
			}

			const appGroupKey = "com.apple.security.application-groups";
			if (fs.existsSync(appEntitlementsPath)) {
				const appEntitlementsPlist = plist.parse(
					fs.readFileSync(appEntitlementsPath, {
						encoding: "utf-8",
					})
				) as plist.PlistObject;

				if (!appEntitlementsPlist[appGroupKey]) {
					// @ts-ignore
					appEntitlementsPlist[appGroupKey] = [`group.${bundleId}`];
					const appEntitlements = plist.build(appEntitlementsPlist);
					console.log("appentitlement:", appEntitlements);
					fs.writeFileSync(appEntitlementsPath, appEntitlements);
				}
			} else {
				content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>com.apple.security.application-groups</key>
	<array>
		<string>group.${bundleId}</string>
	</array>
</dict>
</plist>${EOL}`;
				fs.writeFileSync(appEntitlementsPath, content);
			}

			content = `{
    "frameworks": [
        "SwiftUI.framework",
        "WidgetKit.framework"
    ],
    "targetBuildConfigurationProperties": {
        "ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME": "AccentColor",
        "ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME": "WidgetBackground",
        "CLANG_ANALYZER_NONNULL": "YES",
        "CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION": "YES_AGGRESSIVE",
        "CLANG_CXX_LANGUAGE_STANDARD": "\\"gnu++20\\"",
        "CLANG_ENABLE_OBJC_WEAK": "YES",
        "CLANG_WARN_DOCUMENTATION_COMMENTS": "YES",
        "CLANG_WARN_UNGUARDED_AVAILABILITY": "YES_AGGRESSIVE",
        "CURRENT_PROJECT_VERSION": 1,
        "GCC_C_LANGUAGE_STANDARD": "gnu11",
        "GCC_WARN_UNINITIALIZED_AUTOS": "YES_AGGRESSIVE",
        "GENERATE_INFOPLIST_FILE": "YES",
        "INFOPLIST_KEY_CFBundleDisplayName": "widget",
        "INFOPLIST_KEY_NSHumanReadableCopyright": "\\"Copyright © All rights reserved.\\"",
        "IPHONEOS_DEPLOYMENT_TARGET": 18.0,
        "MARKETING_VERSION": "1.0",
        "MTL_FAST_MATH": "YES",
        "PRODUCT_NAME": "widget",
        "SWIFT_EMIT_LOC_STRINGS": "YES",
        "SWIFT_VERSION": "5.0",
        "TARGETED_DEVICE_FAMILY": "\\"1,2\\"",
        "MTL_ENABLE_DEBUG_INFO": "NO",
        "SWIFT_OPTIMIZATION_LEVEL": "\\"-O\\"",
        "COPY_PHASE_STRIP": "NO",
        "SWIFT_COMPILATION_MODE": "wholemodule",
        "CODE_SIGN_ENTITLEMENTS": "../../App_Resources/iOS/extensions/${name}/${name}.entitlements"
    },
    "targetNamedBuildConfigurationProperties": {
        "debug": {
            "DEBUG_INFORMATION_FORMAT": "dwarf",
            "GCC_PREPROCESSOR_DEFINITIONS": "(\\"DEBUG=1\\",\\"$(inherited)\\",)",
            "MTL_ENABLE_DEBUG_INFO": "INCLUDE_SOURCE",
            "SWIFT_ACTIVE_COMPILATION_CONDITIONS": "DEBUG",
            "SWIFT_OPTIMIZATION_LEVEL": "\\"-Onone\\""
        },
        "release": {
            "CODE_SIGN_STYLE": "Manual",
            "MTL_ENABLE_DEBUG_INFO": "NO",
            "SWIFT_OPTIMIZATION_LEVEL": "\\"-O\\"",
            "COPY_PHASE_STRIP": "NO",
            "SWIFT_COMPILATION_MODE": "wholemodule"
        }
    }
}${EOL}`;

			fs.writeFileSync(extensionsConfigPath, content);

			console.log(
				`🚀 Your widget is now ready to develop: App_Resources/iOS/extensions/${name}.\n`
			);
			console.log(
				`Followup steps:\n
- Update	App_Resources/iOS/extensions/provisioning.json with your profile id.
- Customize	App_Resources/iOS/extensions/${name}/${capitalizeFirstLetter(
					name
				)}LiveActivity.swift for your display.
- Customize	Shared_Resources/iOS/SharedWidget/Sources/SharedWidget/${capitalizeFirstLetter(
					name
				)}Model.swift for your data.
`
			);
		}

		// if (fs.existsSync(filePath)) {
		// 	this.$errors.failWithHelp(`Error: File '${filePath}' already exists.`);
		// 	return;
		// }
	}

	private generateAppleUtility(projectDir: string, name: string): void {
		const appResourcePath = this.$projectData.appResourcesDirectoryPath;
		const appResourceSrcPath = path.join(appResourcePath, "iOS", "src");
		const appleUtilityPath = path.join(
			appResourceSrcPath,
			`AppleWidgetUtils.swift`
		);
		const referenceTypesPath = path.join(projectDir, "references.d.ts");

		if (!fs.existsSync(appleUtilityPath)) {
			fs.mkdirSync(appResourceSrcPath, { recursive: true });
		}
		if (!fs.existsSync(appleUtilityPath)) {
		}

		let content = `import Foundation
import UIKit
import ActivityKit
import WidgetKit
import SharedWidget

@objcMembers
public class AppleWidgetUtils: NSObject {
    
    // Live Activity Handling
    public static func startActivity(_ data: NSDictionary) {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
			let numberOfPizzas = data.object(forKey: "numberOfPizzas") as! Int
            let totalAmount = data.object(forKey: "totalAmount") as! String
            let attrs = ${capitalizeFirstLetter(
							name
						)}Model(numberOfPizzas: numberOfPizzas, totalAmount: totalAmount)
            
			let driverName = data.object(forKey: "driverName") as! String
            let deliveryTime = data.object(forKey: "deliveryTime") as! CGFloat
            let initialStatus = ${capitalizeFirstLetter(
							name
						)}Model.DeliveryStatus(
                driverName: driverName, estimatedDeliveryTime: Date()...Date().addingTimeInterval(deliveryTime * 60))
            let content = ActivityContent(state: initialStatus, staleDate: nil)
            
            do {
                let activity = try Activity<${capitalizeFirstLetter(
									name
								)}Model>.request(
                    attributes: attrs,
                    content: content,
                    pushType: nil)
                print("Requested a Live Activity \\(activity.id)")
            } catch (let error) {
                print("Error requesting Live Activity \\(error.localizedDescription)")
            }
        }
    }
    public static func updateActivity(_ data: NSDictionary) {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            Task {
				let driverName = data.object(forKey: "driverName") as! String
                let deliveryTime = data.object(forKey: "deliveryTime") as! CGFloat
                let status = ${capitalizeFirstLetter(name)}Model.DeliveryStatus(
                    driverName: driverName, estimatedDeliveryTime: Date()...Date().addingTimeInterval(deliveryTime * 60))
                let content = ActivityContent(state: status, staleDate: nil)
                
                for activity in Activity<${capitalizeFirstLetter(
									name
								)}Model>.activities {
                    await activity.update(content)
                }
            }
        }
    }
    public static func cancelActivity(_ data: NSDictionary) {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            Task {
				let driverName = data.object(forKey: "driverName") as! String
                let status = ${capitalizeFirstLetter(name)}Model.DeliveryStatus(
                    driverName: driverName, estimatedDeliveryTime: Date()...Date())
                let content = ActivityContent(state: status, staleDate: nil)
                
                for activity in Activity<${capitalizeFirstLetter(
									name
								)}Model>.activities {
                    await activity.end(content, dismissalPolicy: .immediate)
                }
            }
        }
    }
    public static func showAllActivities() {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            Task {
                for activity in Activity<${capitalizeFirstLetter(
									name
								)}Model>.activities {
                    print("Activity Details: \\(activity.id) -> \\(activity.attributes)")
                }
            }
        }
    }
    
    // Home Screen Widget Handling
    public static func updateWidget() {
        if #available(iOS 14.0, *) {
            Task.detached(priority: .userInitiated) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}${EOL}`;

		fs.writeFileSync(appleUtilityPath, content);

		content = `/**
 * Customize for your own Apple Widget Data
 */
declare interface AppleWidgetModelData {
  numberOfPizzas: number;
  totalAmount: string;
  driverName: string;
  deliveryTime: number;
}
declare class AppleWidgetUtils extends NSObject {
  static startActivity(data: AppleWidgetModelData): void;
  static updateActivity(
    data: Pick<AppleWidgetModelData, "driverName" | "deliveryTime">
  ): void;
  static cancelActivity(data: Pick<AppleWidgetModelData, "driverName">): void;
  static showAllActivities(): void;
  static updateWidget(): void;
}${EOL}`;

		if (!fs.existsSync(referenceTypesPath)) {
			const references = `/// <reference path="./node_modules/@nativescript/types-android/index.d.ts" />
/// <reference path="./node_modules/@nativescript/types-ios/complete.d.ts" />${EOL}${content}`;
			fs.writeFileSync(referenceTypesPath, references);
		} else {
			const references = fs.readFileSync(referenceTypesPath, {
				encoding: "utf-8",
			});
			if (references?.indexOf("AppleWidgetUtils") === -1) {
				content = `${references.toString()}${EOL}${content}`;
				fs.writeFileSync(referenceTypesPath, content);
			}
		}
	}
}

injector.registerCommand(["widget"], WidgetCommand);
injector.registerCommand(["widget|ios"], WidgetIOSCommand);
