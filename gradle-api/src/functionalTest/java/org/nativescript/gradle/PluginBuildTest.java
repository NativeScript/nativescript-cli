package org.nativescript.gradle;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.gradle.testkit.runner.BuildResult;
import org.gradle.testkit.runner.GradleRunner;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * The CLI's build of a plugin's aar: the CLI's own template from vendor/gradle-plugin, with the
 * extracted block of the sample's include.gradle appended, as the CLI does.
 */
class PluginBuildTest {
    // The Android Gradle Plugin version decides which Gradle versions can run this build.
    private static final String ANDROID_GRADLE_PLUGIN = "8.12.1";
    private static final String GRADLE = "8.14.3";

    private static final String PROBE = String.join("\n",
            "",
            "def nsProbe = project.extensions.findByName('nativescript')",
            "println \"NS|extension|${nsProbe != null}\"",
            "if (nsProbe != null) {",
            "    println \"NS|pluginBuild|${nsProbe.pluginBuild}\"",
            "    println \"NS|self|${nsProbe.self?.name}\"",
            "    println \"NS|buildingSample|${nsProbe.isBuildingPlugin('" + Fixtures.SAMPLE_NAME + "')}\"",
            "    println \"NS|projectDir|${nsProbe.projectDir}\"",
            "    println \"NS|appDir|${nsProbe.appDir}\"",
            "}",
            "println \"NS|compileOnly|\" + configurations.compileOnly.dependencies.withType(FileCollectionDependency)"
                    + ".collectMany { it.files.files }.collect { it.name }.sort().join(',')",
            "");

    @TempDir
    Path tempDir;

    @BeforeAll
    static void requireAndroidSdk() {
        String androidHome = System.getenv("ANDROID_HOME");
        assumeTrue(androidHome != null && new File(androidHome).isDirectory(), "ANDROID_HOME is not set");
    }

    @ParameterizedTest(name = "readOnlyNodeModules={0}")
    @ValueSource(booleans = {false, true})
    void configuresThePluginBuild(boolean readOnlyNodeModules) throws Exception {
        Path project = tempDir.toRealPath().resolve("project");
        Path platformsAndroid = project.resolve("platforms/android");
        Fixtures.installCore(project);
        Fixtures.installSample(project);
        Fixtures.write(project.resolve("package.json"), "{ \"name\": \"fixture-app\" }\n");
        Fixtures.write(platformsAndroid.resolve("dependencies.json"), String.join("\n",
                "[",
                "  { \"name\": \"@nativescript/core\", \"directory\": \"../../node_modules/@nativescript/core\", \"dependencies\": [] },",
                "  { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"directory\": \"../../node_modules/" + Fixtures.SAMPLE_NAME + "\", \"dependencies\": [\"@nativescript/core\"] }",
                "]",
                ""));

        Path pluginDir = project.resolve("platforms/tempPlugin/gradle-api-sample");
        Path vendor = Fixtures.vendorGradlePluginDir();
        for (String name : List.of("build.gradle", "settings.gradle", "gradle.properties")) {
            String text = Fixtures.read(vendor.resolve(name))
                    .replace("{{pluginName}}", Fixtures.SAMPLE_NAME)
                    .replace("{{pluginNamespace}}", "org.nativescript.gradle_api_sample")
                    .replace("{{runtimeAndroidPluginVersion}}", ANDROID_GRADLE_PLUGIN);
            assertFalse(text.contains("{{"), "unknown placeholder left in " + name);
            Fixtures.write(pluginDir.resolve(name), text);
        }
        Path buildGradle = pluginDir.resolve("build.gradle");
        Fixtures.write(buildGradle, Fixtures.read(buildGradle) + "\n" + Fixtures.read(extractedIncludeGradle()) + "\n" + PROBE);
        Fixtures.write(pluginDir.resolve("src/main/AndroidManifest.xml"),
                "<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" />\n");

        List<String> arguments = new ArrayList<>(List.of(
                "help", "--stacktrace",
                "--init-script", Fixtures.path(Fixtures.writeInitScript(tempDir)),
                "-PtempBuild=true",
                "-PappPath=" + Fixtures.path(project.resolve("app")),
                "-PappResourcesPath=" + Fixtures.path(project.resolve("app/App_Resources"))));
        if (readOnlyNodeModules) {
            arguments.add("-Pnativescript.readOnlyNodeModules=true");
        }
        Map<String, String> environment = new HashMap<>(System.getenv());
        environment.put("USER_PROJECT_ROOT", Fixtures.path(project));
        environment.put("USER_PROJECT_PLATFORMS_ANDROID", Fixtures.path(platformsAndroid));

        BuildResult result = GradleRunner.create()
                .withGradleVersion(GRADLE)
                .withProjectDir(pluginDir.toFile())
                .withArguments(arguments)
                .withEnvironment(environment)
                .forwardOutput()
                .build();
        Map<String, String> probes = Fixtures.probes(result);

        if (!readOnlyNodeModules) {
            // The template only runs the plugin's own buildscript.gradle on request, so the
            // library is not on the classpath and the block takes its old CLI branch.
            assertEquals("false", probes.get("extension"));
            assertEquals("widgets-release.aar", probes.get("compileOnly"));
            return;
        }
        assertEquals("true", probes.get("extension"));
        assertEquals("true", probes.get("pluginBuild"));
        assertEquals(Fixtures.SAMPLE_NAME, probes.get("self"));
        assertEquals("true", probes.get("buildingSample"));
        assertEquals(Fixtures.path(project), probes.get("projectDir"));
        assertEquals(Fixtures.path(project.resolve("app")), probes.get("appDir"));
        // Only the library's artifacts include archives below the top level.
        assertEquals("inner.aar,widgets-release.aar", probes.get("compileOnly"));
    }

    static Path extractedIncludeGradle() throws URISyntaxException {
        return new File(PluginBuildTest.class.getResource("/extracted/sample-plugin-include.gradle").toURI()).toPath();
    }
}
