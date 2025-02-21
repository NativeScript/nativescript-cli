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
			message: `What type of widget would you like?`,
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

		const bundleId = this.$projectConfigService.getValue(`id`, "");

		switch (result.value) {
			case 0:
				this.$logger.info("TODO");
				break;
			case 1:
				await this.generateSharedWidgetPackage(
					this.$projectData.projectDir,
					name
				);
				this.generateWidget(
					this.$projectData.projectDir,
					name,
					bundleId,
					result.value
				);
				this.generateAppleUtility(this.$projectData.projectDir, name, bundleId);
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
    public var message: String
    public var deliveryTime: Double

    public init(message: String, deliveryTime: Double) {
      self.message = message
      self.deliveryTime = deliveryTime
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

	private generateWidget(
		projectDir: string,
		name: string,
		bundleId: string,
		type: number
	): void {
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
		// const appIntentPath = path.join(widgetPath, `AppIntent.swift`);
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
	<key>CFBundleShortVersionString</key>
	<string>1.0</string>
	<key>CFBundleVersion</key>
	<string>1.0</string>
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
struct ${capitalName}Bundle: SwiftUI.WidgetBundle {
	var body: some Widget {
		${[1, 2].includes(type) ? capitalName + "HomeScreenWidget()" : ""}
		${[0, 1].includes(type) ? capitalName + "LiveActivity()" : ""}
	}
}${EOL}`;

			fs.writeFileSync(widgetBundlePath, content);

			if ([0, 1].includes(type)) {
				content = `import ActivityKit
import SwiftUI
import WidgetKit
import Foundation
import SharedWidget
import os

struct ${capitalName}LiveActivity: Widget {
    
	var body: some WidgetConfiguration {
		ActivityConfiguration(for: ${capitalName}Model.self) { context in

			LockScreenView(message: context.state.message, deliveryTime: context.state.deliveryTime)
				.activityBackgroundTint(Color.black)
				.activitySystemActionForegroundColor(Color.white)

		} dynamicIsland: { context in
			DynamicIsland {
				DynamicIslandExpandedRegion(.leading) {
					Image(systemName: context.state.deliveryTime >= 0 ? "car.side.arrowtriangle.up.fill" : "face.smiling.inverse")
						.resizable()
						.scaledToFit()
						.frame(width: 50, height: 50)
						.foregroundColor(context.state.deliveryTime >= 0 ? Color.green : Color.blue)
				}
				DynamicIslandExpandedRegion(.trailing) {
					if (context.state.deliveryTime >= 0) {
						ZStack {
							ProgressView(value: context.state.deliveryTime, total: 60)
								.progressViewStyle(.circular)
								.tint(Color.green)
								.frame(width: 75, height: 75)
							Text("\\(formatter.string(for: context.state.deliveryTime) ?? "") mins")
								.font(.system(size: 11)) 
								.foregroundStyle(.white)
						}.frame(width: 75, height: 75)
					} else {
						Image(systemName: "checkmark.circle.fill")
							.resizable()
							.scaledToFit()
							.frame(width: 50, height: 50)
							.foregroundColor(.blue)
					}
				}
				DynamicIslandExpandedRegion(.bottom) {
					Text("\\(context.state.message)")
				}
			} compactLeading: {
				Image(systemName: context.state.deliveryTime >= 0 ? "car.side.arrowtriangle.up.fill" : "face.smiling.inverse")
					.resizable()
					.scaledToFit()
					.frame(width: 20, height: 20)
					.foregroundColor(context.state.deliveryTime >= 0 ? .green : .blue)
			} compactTrailing: {
				Image(systemName: context.state.deliveryTime >= 0 ? "timer.circle.fill" : "checkmark.circle.fill")
					.resizable()
					.scaledToFit()
					.frame(width: 20, height: 20)
					.foregroundColor(context.state.deliveryTime >= 0 ? .green : .blue)
			} minimal: {
				Text(context.state.message).font(.system(size: 12)) 
			}
			.widgetURL(URL(string: "http://www.apple.com"))
			.keylineTint(Color.red)
		}
	}

	private let formatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.maximumFractionDigits = 0
        formatter.minimumFractionDigits = 0
        return formatter
    }()
}

struct LockScreenView: View {
	@State private var message = ""
	@State private var deliveryTime: Double = 0
	// for console debugging
	let logger = Logger(subsystem: "${bundleId}.${name}", category: "Widget")

	var body: some View {
		ZStack {
			LinearGradient(
				gradient: Gradient(colors: [Color.gray.opacity(0.3), Color.black]),
				startPoint: .top,
				endPoint: .bottom
			)
			VStack {
				Spacer()
				Image(systemName: deliveryTime >= 0 ? "car.side.arrowtriangle.up.fill" : "face.smiling.inverse")
					.resizable()
					.scaledToFit()
					.frame(width: 50, height: 50)
					.foregroundColor(deliveryTime >= 0 ? .green : .blue)
				Spacer()
				Text("\\(message)")
					.foregroundStyle(.white)
				Spacer()
			}
		}.frame(maxWidth: .infinity, maxHeight: .infinity)		
	}

	init(message: String = "", deliveryTime: Double = 0) {
        _message = State(initialValue: message)
        _deliveryTime = State(initialValue: deliveryTime)

        // Logs the deliveryTime at init for debugging purposes if needed
        logger.log("deliveryTime: \(deliveryTime)")
    }
}${EOL}`;

				fs.writeFileSync(widgetLiveActivityPath, content);
			}

			if ([1, 2].includes(type)) {
				content = `import SwiftUI
import WidgetKit

/**
 * Widget data shared between the app and the widget extension.
 */
struct WidgetData: Codable {
    let pizzas: [String]
    let orderTime: Double
    let delivered: Bool
}

struct Provider: TimelineProvider {
    
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), pizza: "Pepperoni", delivered: false, orderTime: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) {
        let entry = SimpleEntry(date: Date(), pizza: "Pepperoni", delivered: false, orderTime: Date())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping @Sendable (Timeline<Entry>) -> ()) {
        var entries: [SimpleEntry] = []

        if let sharedDefaults = UserDefaults(suiteName: "group.${bundleId}") {
            let currentDate = Date()
            if let jsonString = sharedDefaults.string(forKey: "widgetData") {
                if let jsonData = jsonString.data(using: .utf8) {
                    do {
                        let widgetData = try JSONDecoder().decode(WidgetData.self, from: jsonData)
                        let pizzas = widgetData.pizzas
                        let orderTime = Date(timeIntervalSince1970: widgetData.orderTime/1000)
                        let delivered = widgetData.delivered
                        
                        // Generate a timeline of entries 1 second apart, starting from the current date.
                        for secondOffset in 0..<pizzas.count {
                            let entryDate = Calendar.current.date(
                                byAdding: .second, value: secondOffset, to: currentDate)!
                            let entry = SimpleEntry(date: entryDate, pizza: secondOffset < pizzas.count ? pizzas[secondOffset] : pizzas[0], delivered: delivered, orderTime: orderTime)
                            entries.append(entry)
                        }
                    } catch {
                        print("Failed to decode JSON: (error)")
                    }
                }
            } else {
                let entry = SimpleEntry(date: currentDate, pizza: "", delivered: false, orderTime: nil)
                entries.append(entry)
            }
        }

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }

//    func relevances() async -> WidgetRelevances<Void> {
//        // Generate a list containing the contexts this widget is relevant in.
//    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let pizza: String
    let delivered: Bool
    let orderTime: Date?
}

struct WidgetView: View {
    @Environment(\.widgetFamily) var widgetFamily
    var entry: Provider.Entry
    
    var body: some View {
        VStack {
            if (entry.pizza != "") {
                Spacer()
                Image(systemName: entry.delivered ? "face.smiling.inverse" : "car.side")
                    .resizable()
                    .scaledToFit()
                    .frame(width: iconSize(for: widgetFamily), height: iconSize(for: widgetFamily))
                    .foregroundColor(entry.delivered ? .blue : .green)
                Spacer()
                if (entry.delivered) {
                    Text("Pizza Delivered!")
                        .font(.system(size: fontSize(for: widgetFamily), weight: .bold))
                        .foregroundStyle(.white)
                } else {
                    HStack(spacing: 4) {
                        Text("Ordered:")
                            .font(.system(size: fontSize(for: widgetFamily)))
                            .foregroundStyle(.white)
                        Text(entry.orderTime!, style: .time)
                            .font(.system(size: fontSize(for: widgetFamily), weight: .bold))
                            .foregroundStyle(.white)
                    }
                    HStack(spacing: 4) {
                        Text("Pizza:")
                            .font(.system(size: fontSize(for: widgetFamily)))
                            .foregroundStyle(.white)
                        Text(entry.pizza)
                            .font(.system(size: fontSize(for: widgetFamily), weight: .bold))
                            .foregroundStyle(.white)
                    } 
                }
                Spacer() 
            } else {
                Spacer()
                Image(systemName: "car.side.rear.open")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 55, height: 55)
                    .foregroundColor(.gray)
                Spacer()
                Text("Awaiting orders...")
                    .foregroundStyle(.white)
                Spacer()
            }
        }.frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func iconSize(for family: WidgetFamily) -> CGFloat {
        switch family {
        case .systemSmall:
            return 65
        case .systemMedium:
            return 85
        case .systemLarge:
            return 150
        default:
            return 65 
        }
    }

    private func fontSize(for family: WidgetFamily) -> CGFloat {
        switch family {
        case .systemSmall:
            return 12
        case .systemMedium:
            return 14
        case .systemLarge:
            return 18
        default:
            return 14 
        }
    }
}

@available(iOSApplicationExtension 17.0, *)
struct ${capitalName}HomeScreenWidget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            WidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    LinearGradient(
                        gradient: Gradient(colors: [Color.black.opacity(0.6), Color.black]),
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
        }
        .configurationDisplayName("${capitalName} Widget")
        .description("${capitalName} delivery service.")
    }
}

#Preview(as: .systemSmall) {
    ${capitalName}HomeScreenWidget()
} timeline: {
    SimpleEntry(date: .now, pizza: "Pepperoni", delivered: false, orderTime: Date())
    SimpleEntry(date: .now, pizza: "Hawaiian", delivered: false, orderTime: Date())
}${EOL}`;
				fs.writeFileSync(widgetHomeScreenPath, content);
			}

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
- Check		App_Resources/iOS/build.xcconfig uses IPHONEOS_DEPLOYMENT_TARGET=17 or higher.
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

	private generateAppleUtility(
		projectDir: string,
		name: string,
		bundleId: string
	): void {
		const capitalName = capitalizeFirstLetter(name);
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
            let attrs = ${capitalName}Model(numberOfPizzas: numberOfPizzas, totalAmount: totalAmount)
            
			let message = data.object(forKey: "message") as! String
            let deliveryTime = data.object(forKey: "deliveryTime") as! Double
            let initialStatus = ${capitalName}Model.DeliveryStatus(
                message: message, deliveryTime: deliveryTime)
            let content = ActivityContent(state: initialStatus, staleDate: nil)
            
            do {
                let activity = try Activity<${capitalName}Model>.request(
                    attributes: attrs,
                    content: content,
                    pushType: nil)
                print("Requested a Live Activity \(activity.id)")
            } catch (let error) {
                print("Error requesting Live Activity \(error.localizedDescription)")
            }
        }
    }
    public static func updateActivity(_ data: NSDictionary) {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            Task {
				let message = data.object(forKey: "message") as! String
                let deliveryTime = data.object(forKey: "deliveryTime") as! Double
                let status = ${capitalName}Model.DeliveryStatus(
                    message: message, deliveryTime: deliveryTime)
                let content = ActivityContent(state: status, staleDate: nil)
                
                for activity in Activity<${capitalName}Model>.activities {
                    await activity.update(content)
                }
            }
        }
    }
    public static func cancelActivity(_ data: NSDictionary) {
        if ActivityAuthorizationInfo().areActivitiesEnabled {
            Task {
				let message = data.object(forKey: "message") as! String
                let status = ${capitalName}Model.DeliveryStatus(
                    message: message, deliveryTime: 0)
                let content = ActivityContent(state: status, staleDate: nil)
                
                for activity in Activity<${capitalName}Model>.activities {
                    await activity.end(content, dismissalPolicy: .immediate)
                }
            }
        }
    }
    public static func getData(key: String) -> String? {
		guard let sharedDefaults = UserDefaults(suiteName: "group.${bundleId}") else {
			return nil
		}
		return sharedDefaults.object(forKey: key) as? String
	}
    public static func updateData(key: String, _ data: String) {
		guard let sharedDefaults = UserDefaults(suiteName: "group.${bundleId}") else {
			return
		}
		sharedDefaults.set(data, forKey: key)
    	sharedDefaults.synchronize()
	}
	public static func removeData(key: String) {
		guard let sharedDefaults = UserDefaults(suiteName: "group.${bundleId}") else {
			return
		}
		sharedDefaults.removeObject(forKey: key)
        sharedDefaults.synchronize()
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
    data: Pick<AppleWidgetModelData, "message" | "deliveryTime">
  ): void;
  static cancelActivity(data: Pick<AppleWidgetModelData, "message">): void;
  static updateWidget(): void;
  static updateDataWithKey(key: string, data: string): void;
  static getDataWithKey(key: string): string;
  static removeDataWithKey(key: string): void;
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
