package org.nativescript.gradle;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.File;
import java.net.URISyntaxException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.gradle.testkit.runner.BuildResult;
import org.gradle.testkit.runner.GradleRunner;
import org.gradle.testkit.runner.TaskOutcome;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * The CLI's build of a plugin's aar: a CLI's template with the extracted block of the sample's
 * include.gradle appended, as the CLI does, compiling a class that uses one from core's aar.
 */
class PluginBuildTest {
    // The Android Gradle Plugin version decides which Gradle versions can run this build.
    private static final String ANDROID_GRADLE_PLUGIN = "8.12.1";
    private static final String GRADLE = "8.14.3";
    private static final String COMPILE_TASK = ":compileReleaseJavaWithJavac";

    enum Template {
        /**
         * CLI 9.1 and older: a copy of the template they ship, in cli-9.1-plugin-template. It must
         * never change, so that the sample keeps being checked against what those CLIs run.
         */
        CLI_9_1,
        /** The current CLI's template, from vendor/gradle-plugin. */
        CURRENT;

        Path dir() throws URISyntaxException {
            return this == CURRENT
                    ? Fixtures.vendorGradlePluginDir()
                    : new File(PluginBuildTest.class.getResource("/cli-9.1-plugin-template").toURI()).toPath();
        }
    }

    // Evaluated inside a dependencies block, as the extracted block is. The `fallback.` probes are
    // the older CLIs' equivalents of the library members the README pairs them with.
    private static final String PROBE = String.join("\n",
            "",
            "dependencies {",
            "    println \"NS|fallback.pluginBuild|${project.hasProperty('tempBuild')}\"",
            "    println \"NS|fallback.projectDir|${file(USER_PROJECT_ROOT)}\"",
            "    println \"NS|fallback.appResourcesDir|${file(getAppResourcesPath())}\"",
            "    println \"NS|fallback.corePackage|${file(\"$USER_PROJECT_ROOT/node_modules/@nativescript/core\")}\"",
            "    println \"NS|fallback.coreArtifacts|\" + fileTree(dir: \"$USER_PROJECT_ROOT/node_modules/@nativescript/core/platforms/android\","
                    + " include: ['**/*.aar', '**/*.jar']).files.collect { it.name }.sort().join(',')",
            "    def nsProbe = project.extensions.findByName('nativescript')",
            "    println \"NS|extension|${nsProbe != null}\"",
            "    if (nsProbe != null) {",
            "        println \"NS|pluginBuild|${nsProbe.pluginBuild}\"",
            "        println \"NS|self|${nsProbe.self?.name}\"",
            "        println \"NS|buildingSample|${nsProbe.isBuildingPlugin('" + Fixtures.SAMPLE_NAME + "')}\"",
            "        println \"NS|projectDir|${nsProbe.projectDir}\"",
            "        println \"NS|appDir|${nsProbe.appDir}\"",
            "        println \"NS|appResourcesDir|${nsProbe.appResourcesDir}\"",
            "        println \"NS|corePackage|${nsProbe.findPackage('@nativescript/core')}\"",
            "        println \"NS|coreArtifacts|\" + nsProbe.plugin('@nativescript/core').artifacts.files.collect { it.name }.sort().join(',')",
            "    }",
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

    @ParameterizedTest(name = "{0} template")
    @EnumSource(Template.class)
    void compilesThePluginAgainstCore(Template template) throws Exception {
        Path project = tempDir.toRealPath().resolve("project");
        Path platformsAndroid = project.resolve("platforms/android");
        Fixtures.installCore(project);
        Fixtures.installSample(project);
        Fixtures.write(project.resolve("package.json"), "{ \"name\": \"fixture-app\" }\n");
        // Core is a peer of the sample, as of most plugins: the template adds no dependency on it,
        // so the compile relies on the include.gradle block.
        Fixtures.write(platformsAndroid.resolve("dependencies.json"), String.join("\n",
                "[",
                "  { \"name\": \"@nativescript/core\", \"directory\": \"../../node_modules/@nativescript/core\", \"dependencies\": [] },",
                "  { \"name\": \"" + Fixtures.SAMPLE_NAME + "\", \"directory\": \"../../node_modules/" + Fixtures.SAMPLE_NAME + "\", \"dependencies\": [] }",
                "]",
                ""));

        Path pluginDir = project.resolve("platforms/tempPlugin/gradle-api-sample");
        for (String name : List.of("build.gradle", "settings.gradle", "gradle.properties")) {
            String text = Fixtures.read(template.dir().resolve(name))
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
        Fixtures.write(pluginDir.resolve("src/main/java/org/nativescript/gradle_api_sample/UsesCore.java"), String.join("\n",
                "package org.nativescript.gradle_api_sample;",
                "",
                "public final class UsesCore {",
                "    public static Class<?> coreClass() { return " + Fixtures.CORE_CLASS + ".class; }",
                "}",
                ""));

        // Outside host-project embedding the CLI sets neither variable, so the template's defaults apply.
        Map<String, String> environment = new HashMap<>(System.getenv());
        environment.remove("USER_PROJECT_ROOT");
        environment.remove("USER_PROJECT_PLATFORMS_ANDROID");
        BuildResult result = GradleRunner.create()
                .withGradleVersion(GRADLE)
                .withProjectDir(pluginDir.toFile())
                .withArguments(
                        COMPILE_TASK, "--stacktrace",
                        "--init-script", Fixtures.path(Fixtures.writeInitScript(tempDir)),
                        "-PtempBuild=true",
                        "-PappPath=" + Fixtures.path(project.resolve("app")),
                        "-PappResourcesPath=" + Fixtures.path(project.resolve("app/App_Resources")))
                .withEnvironment(environment)
                .forwardOutput()
                .build();
        Map<String, String> probes = Fixtures.probes(result);

        assertEquals(TaskOutcome.SUCCESS, result.task(COMPILE_TASK).getOutcome());
        assertEquals("inner.aar,widgets-release.aar", probes.get("compileOnly"));

        String projectDir = Fixtures.path(project);
        String appResourcesDir = Fixtures.path(project.resolve("app/App_Resources"));
        String corePackage = Fixtures.path(project.resolve("node_modules/@nativescript/core"));
        String coreArtifacts = "inner.aar,widgets-release.aar";
        assertEquals("true", probes.get("fallback.pluginBuild"));
        assertEquals(projectDir, probes.get("fallback.projectDir"));
        assertEquals(appResourcesDir, probes.get("fallback.appResourcesDir"));
        assertEquals(corePackage, probes.get("fallback.corePackage"));
        assertEquals(coreArtifacts, probes.get("fallback.coreArtifacts"));

        if (template == Template.CLI_9_1) {
            // Without the extension the block can only have taken its fallback branch.
            assertEquals("false", probes.get("extension"));
            return;
        }
        assertEquals("true", probes.get("extension"));
        assertEquals("true", probes.get("pluginBuild"));
        assertEquals(Fixtures.SAMPLE_NAME, probes.get("self"));
        assertEquals("true", probes.get("buildingSample"));
        assertEquals(projectDir, probes.get("projectDir"));
        assertEquals(Fixtures.path(project.resolve("app")), probes.get("appDir"));
        assertEquals(appResourcesDir, probes.get("appResourcesDir"));
        assertEquals(corePackage, probes.get("corePackage"));
        assertEquals(coreArtifacts, probes.get("coreArtifacts"));
    }

    static Path extractedIncludeGradle() throws URISyntaxException {
        return new File(PluginBuildTest.class.getResource("/extracted/sample-plugin-include.gradle").toURI()).toPath();
    }
}
