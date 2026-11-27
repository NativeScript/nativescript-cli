package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.nativescript.gradle.internal.TestFiles.plugin;
import static org.nativescript.gradle.internal.TestFiles.writeFacts;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.function.Consumer;
import org.gradle.api.GradleException;
import org.gradle.testfixtures.ProjectBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.nativescript.gradle.NativeScriptExtension;

class DefaultNativeScriptExtensionTest {
    @TempDir
    Path tempDir;

    private Path project;
    private Path platformsAndroid;
    private Path factsFile;

    @BeforeEach
    void setUp() throws IOException {
        project = tempDir.toRealPath().resolve("proj");
        platformsAndroid = Files.createDirectories(project.resolve("platforms/android"));
        factsFile = platformsAndroid.resolve(Resolution.FACTS_FILE_NAME);
    }

    @ParameterizedTest(name = "plugin build: {0}")
    @ValueSource(booleans = {false, true})
    void answersBuildQuestionsWithoutFacts(boolean pluginBuild) {
        NativeScriptExtension ns = extension(pluginBuild);

        assertEquals(1, ns.getApiLevel());
        assertEquals(pluginBuild, ns.isPluginBuild());
        assertEquals(pluginBuild, ns.isBuildingPlugin("@scope/p"));
        assertFalse(ns.isBuildingPlugin("other"));
    }

    @ParameterizedTest(name = "plugin build: {0}")
    @ValueSource(booleans = {false, true})
    void needsFactsForEverythingAboutTheProject(boolean pluginBuild) {
        NativeScriptExtension ns = extension(pluginBuild);
        Map<String, Consumer<NativeScriptExtension>> members = Map.of(
                "has", e -> e.has("x"),
                "self", NativeScriptExtension::getSelf,
                "projectDir", NativeScriptExtension::getProjectDir,
                "appDir", NativeScriptExtension::getAppDir,
                "appResourcesDir", NativeScriptExtension::getAppResourcesDir,
                "plugin", e -> e.plugin("@nativescript/core"),
                "findPlugin", e -> e.findPlugin("@nativescript/core"),
                "resolvePackage", e -> e.resolvePackage("@nativescript/core"),
                "findPackage", e -> e.findPackage("@nativescript/core"));

        members.forEach((member, call) -> {
            GradleException e = assertThrows(GradleException.class, () -> call.accept(ns), member);
            assertEquals(
                    pluginBuild
                            ? ResolutionTest.noFactsMessage(project.resolve("platforms/tempPlugin/p"), platformsAndroid)
                            : ResolutionTest.noFactsMessage(platformsAndroid),
                    e.getMessage(),
                    member);
        });
    }

    @Test
    void readsTheFactsAgainAfterAFailure() throws IOException {
        NativeScriptExtension ns = extension(false);
        assertThrows(GradleException.class, ns::getProjectDir);

        writeFacts(factsFile, project, "[]", null);

        assertEquals(project.toFile(), ns.getProjectDir());
        assertEquals(project.resolve("src").toFile(), ns.getAppDir());
        assertEquals(project.resolve("src/App_Resources").toFile(), ns.getAppResourcesDir());
        assertTrue(ns.has("some.capability"));
    }

    @Test
    void selfIsTheListedPluginBeingBuilt() throws IOException {
        writeFacts(factsFile, project, "[" + plugin("@scope/p", "../../node_modules/@scope/p") + "]", null);

        assertEquals("@scope/p", extension(true).getSelf().getName());
        assertNull(extension(false).getSelf());
    }

    @Test
    void pluginErrorListsTheListedPlugins() throws IOException {
        writeFacts(factsFile, project, "[" + plugin("a", "../a") + ", " + plugin("@s/b", "../b") + "]", null);

        GradleException e = assertThrows(GradleException.class, () -> extension(false).plugin("c"));

        assertEquals(
                "NativeScript plugin 'c' is not listed in " + factsFile + ". Known plugins: a, @s/b. Only packages"
                        + " that declare Android support in their package.json are plugins; find any other package with"
                        + " resolvePackage.",
                e.getMessage());
    }

    private NativeScriptExtension extension(boolean pluginBuild) {
        FakeInputs inputs = pluginBuild
                ? new FakeInputs(project.resolve("platforms/tempPlugin/p").toFile())
                        .property("tempBuild", "true")
                        .property("PLUGIN_NAME", "@scope/p")
                        .property("USER_PROJECT_PLATFORMS_ANDROID", platformsAndroid.toString())
                : new FakeInputs(platformsAndroid.toFile());
        return new DefaultNativeScriptExtension(
                inputs,
                ProjectBuilder.builder().withProjectDir(tempDir.resolve("gradle").toFile()).build().getObjects());
    }
}
