package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.gradle.api.GradleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class FactsTest {
    @TempDir
    Path tempDir;

    private Path projectDir;
    private Path platformsAndroid;
    private File factsFile;

    @BeforeEach
    void setUp() throws IOException {
        projectDir = tempDir.toRealPath();
        platformsAndroid = projectDir.resolve("platforms/android");
        Files.createDirectories(platformsAndroid);
        factsFile = platformsAndroid.resolve("nativescript-gradle.json").toFile();
    }

    @Test
    void readsBasicFacts() throws IOException {
        copyResource("/facts/v1-basic.json", factsFile.toPath());

        Facts facts = Facts.read(factsFile);

        assertEquals(factsFile, facts.getFile());
        assertEquals(1, facts.getSchemaVersion());
        assertTrue(facts.getCapabilities().isEmpty());
        assertEquals(projectDir.toFile(), facts.getProjectRoot());
        assertEquals(projectDir.resolve("src").toFile(), facts.getAppDir());
        assertEquals(projectDir.resolve("App_Resources").toFile(), facts.getAppResourcesDir());
        assertEquals(
                Arrays.asList("@nativescript/core", "@foo/plugin-x", "@bar/plugin-x"),
                new ArrayList<>(facts.getPlugins().keySet()));

        PluginData core = facts.getPlugins().get("@nativescript/core");
        assertEquals("@nativescript/core", core.getName());
        assertEquals(projectDir.resolve("node_modules/@nativescript/core").toFile(), core.getPackageDir());
        assertEquals(
                projectDir.resolve("node_modules/@nativescript/core/platforms/android").toFile(), core.getNativeDir());
        assertEquals("core", core.getAarName());
        assertEquals(
                projectDir.resolve("node_modules/@nativescript/core/platforms/android/core.aar").toFile(), core.getAar());
        assertEquals(Collections.emptyList(), core.getDependencies());

        PluginData x = facts.getPlugins().get("@foo/plugin-x");
        assertEquals(projectDir.resolve("node_modules/@foo/plugin-x").toFile(), x.getPackageDir());
        assertEquals(platformsAndroid.resolve(".ns-plugins/foo_plugin_x/platforms/android").toFile(), x.getNativeDir());
        assertEquals("foo_plugin_x", x.getAarName());
        assertEquals(
                platformsAndroid.resolve(".ns-plugins/foo_plugin_x/platforms/android/foo_plugin_x.aar").toFile(),
                x.getAar());
        assertEquals(Collections.singletonList("@nativescript/core"), x.getDependencies());
        assertTrue(x.getOptions().isEmpty());

        assertThrows(UnsupportedOperationException.class, () -> x.getOptions().put("k", "v"));
        assertThrows(UnsupportedOperationException.class, () -> x.getDependencies().add("y"));
        assertThrows(UnsupportedOperationException.class, () -> facts.getPlugins().remove("@foo/plugin-x"));
        assertThrows(UnsupportedOperationException.class, () -> facts.getCapabilities().add("c"));
    }

    @Test
    void readsNewerSchemaVersionAndIgnoresUnknownFields() throws IOException {
        copyResource("/facts/v2-unknown-fields.json", factsFile.toPath());

        Facts facts = Facts.read(factsFile);

        assertEquals(2, facts.getSchemaVersion());
        assertEquals(Collections.singleton("some.future.capability"), facts.getCapabilities());
        assertEquals(projectDir.toFile(), facts.getProjectRoot());
        assertEquals(projectDir.resolve("app").toFile(), facts.getAppDir());
        assertEquals(projectDir.resolve("app/App_Resources").toFile(), facts.getAppResourcesDir());
        assertEquals(Collections.singletonList("nativescript-plugin"), new ArrayList<>(facts.getPlugins().keySet()));
        PluginData plugin = facts.getPlugins().get("nativescript-plugin");
        assertEquals("nativescript_plugin", plugin.getAarName());
        assertEquals(Collections.singletonMap("someOption", Arrays.asList("a", "b")), plugin.getOptions());
    }

    @Test
    void readsFactsFromResourceInPlace() throws Exception {
        File resource = new File(getClass().getResource("/facts/v1-basic.json").toURI());

        Facts facts = Facts.read(resource);

        Path dir = resource.getAbsoluteFile().toPath().getParent();
        assertEquals(dir.resolve("../..").normalize().toFile(), facts.getProjectRoot());
        assertEquals(3, facts.getPlugins().size());
    }

    @Test
    void optionsDefaultToEmptyWhenAbsent() {
        Map<String, String> plugin = pluginFields("p");
        plugin.remove("options");

        Facts facts = parse(document(PROJECT, "[" + object(plugin) + "]"));

        assertTrue(facts.getPlugins().get("p").getOptions().isEmpty());
        assertTrue(facts.getCapabilities().isEmpty());
    }

    @Test
    void keepsAbsolutePathsAbsolute() {
        Path elsewhere = projectDir.resolve("elsewhere");
        String project = "{\"root\": " + quote(elsewhere) + ", \"appDir\": " + quote(elsewhere.resolve("app"))
                + ", \"appResourcesDir\": " + quote(elsewhere.resolve("res")) + "}";
        Map<String, String> plugin = pluginFields("p");
        plugin.put("nativeDir", quote(elsewhere.resolve("native")));

        Facts facts = parse(document(project, "[" + object(plugin) + "]"));

        assertEquals(elsewhere.toFile(), facts.getProjectRoot());
        assertEquals(elsewhere.resolve("app").toFile(), facts.getAppDir());
        assertEquals(elsewhere.resolve("res").toFile(), facts.getAppResourcesDir());
        assertEquals(elsewhere.resolve("native").toFile(), facts.getPlugins().get("p").getNativeDir());
    }

    @Test
    void normalizesRelativePaths() {
        String project =
                "{\"root\": \"./a/../../..\", \"appDir\": \"../../x/./y/../app\", \"appResourcesDir\": \"res/\"}";

        Facts facts = parse(document(project, "[]"));

        assertEquals(projectDir.toFile(), facts.getProjectRoot());
        assertEquals(projectDir.resolve("x/app").toFile(), facts.getAppDir());
        assertEquals(platformsAndroid.resolve("res").toFile(), facts.getAppResourcesDir());
    }

    @Test
    void acceptsBomAndCapabilities() {
        Facts facts = parse("﻿{\"schemaVersion\": 1, \"capabilities\": [\"a\", \"b\"], \"project\": " + PROJECT
                + ", \"plugins\": []}");

        assertEquals(Arrays.asList("a", "b"), new ArrayList<>(facts.getCapabilities()));
    }

    @Test
    void reportsMissingSchemaVersion() {
        assertInvalid("{\"project\": " + PROJECT + ", \"plugins\": []}", "schemaVersion must be an integer");
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1"})
    void reportsSchemaVersionBelowOne(String version) {
        assertInvalid(document(version, PROJECT, "[]"), "schemaVersion must be at least 1");
    }

    @ParameterizedTest
    @ValueSource(strings = {"\"1\"", "1.5", "null", "true", "2147483648"})
    void reportsNonIntegerSchemaVersion(String version) {
        assertInvalid(document(version, PROJECT, "[]"), "schemaVersion must be an integer");
    }

    @ParameterizedTest
    @ValueSource(strings = {"[]", "1", "\"facts\"", "null"})
    void reportsNonObjectTopLevel(String text) {
        assertInvalid(text, "the top level must be an object");
    }

    @Test
    void reportsMissingProject() {
        assertInvalid("{\"schemaVersion\": 1, \"plugins\": []}", "project must be an object");
    }

    @Test
    void reportsNonObjectProject() {
        assertInvalid(document("\"..\"", "[]"), "project must be an object");
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "{\"root\": 1, \"appDir\": \"a\", \"appResourcesDir\": \"r\"}|project.root must be a string",
                "{\"root\": \"\", \"appDir\": \"a\", \"appResourcesDir\": \"r\"}|project.root must not be empty",
                "{\"appDir\": \"a\", \"appResourcesDir\": \"r\"}|project.root must be a string",
                "{\"root\": \".\", \"appResourcesDir\": \"r\"}|project.appDir must be a string",
                "{\"root\": \".\", \"appDir\": \"a\"}|project.appResourcesDir must be a string",
                "{\"root\": \".\", \"appDir\": \"a\", \"appResourcesDir\": \"\"}|project.appResourcesDir must not be empty",
            })
    void reportsInvalidProjectFields(String project, String problem) {
        assertInvalid(document(project, "[]"), problem);
    }

    @ParameterizedTest
    @ValueSource(strings = {"{}", "\"p\"", "null"})
    void reportsNonArrayPlugins(String plugins) {
        assertInvalid(document(PROJECT, plugins), "plugins must be an array");
    }

    @Test
    void reportsMissingPlugins() {
        assertInvalid("{\"schemaVersion\": 1, \"project\": " + PROJECT + "}", "plugins must be an array");
    }

    @Test
    void reportsNonObjectPlugin() {
        assertInvalid(document(PROJECT, "[" + object(pluginFields("a")) + ", \"b\"]"), "plugins[1] must be an object");
    }

    @ParameterizedTest
    @CsvSource({
        "name, plugins[0].name must be a string",
        "packageDir, plugins[0].packageDir must be a string",
        "nativeDir, plugins[0].nativeDir must be a string",
        "aarName, plugins[0].aarName must be a string",
        "aar, plugins[0].aar must be a string",
        "dependencies, plugins[0].dependencies must be an array",
    })
    void reportsMissingPluginField(String field, String problem) {
        Map<String, String> plugin = pluginFields("p");
        plugin.remove(field);
        assertInvalid(document(PROJECT, "[" + object(plugin) + "]"), problem);
    }

    @ParameterizedTest
    @CsvSource(
            delimiter = '|',
            value = {
                "name|\"\"|plugins[0].name must not be empty",
                "aarName|\"\"|plugins[0].aarName must not be empty",
                "nativeDir|\"\"|plugins[0].nativeDir must not be empty",
                "nativeDir|3|plugins[0].nativeDir must be a string",
                "dependencies|[\"a\", 1]|plugins[0].dependencies[1] must be a string",
                "dependencies|\"a\"|plugins[0].dependencies must be an array",
                "options|[]|plugins[0].options must be an object",
                "options|null|plugins[0].options must be an object",
            })
    void reportsInvalidPluginField(String field, String value, String problem) {
        Map<String, String> plugin = pluginFields("p");
        plugin.put(field, value);
        assertInvalid(document(PROJECT, "[" + object(plugin) + "]"), problem);
    }

    @Test
    void reportsNonArrayCapabilities() {
        assertInvalid(
                "{\"schemaVersion\": 1, \"capabilities\": \"a\", \"project\": " + PROJECT + ", \"plugins\": []}",
                "capabilities must be an array");
    }

    @Test
    void reportsNonStringCapability() {
        assertInvalid(
                "{\"schemaVersion\": 1, \"capabilities\": [\"a\", 1], \"project\": " + PROJECT + ", \"plugins\": []}",
                "capabilities[1] must be a string");
    }

    @Test
    void reportsDuplicatePluginName() {
        String plugins = "[" + object(pluginFields("a")) + ", " + object(pluginFields("b")) + ", "
                + object(pluginFields("a")) + "]";
        assertInvalid(document(PROJECT, plugins), "plugin 'a' is listed more than once");
    }

    @Test
    void reportsInvalidJsonWithPosition() {
        GradleException e = assertThrows(
                GradleException.class, () -> Facts.parse(factsFile, "{\n  \"schemaVersion\": 1,\n}"));
        assertTrue(e.getMessage().startsWith("Invalid NativeScript facts file " + factsFile + ": "), e.getMessage());
        assertTrue(e.getMessage().contains("expected a string key at line 3, column 1"), e.getMessage());
    }

    @Test
    void readReusesResultWhileFileIsUnchanged() throws IOException {
        write(factsFile, minimal("\"a\""));

        Facts first = Facts.read(factsFile);

        assertSame(first, Facts.read(factsFile));
        assertSame(first, Facts.read(new File(factsFile.getPath())));
    }

    @Test
    void readReparsesWhenLengthChanges() throws IOException {
        write(factsFile, minimal("\"a\""));
        Facts first = Facts.read(factsFile);
        long lastModified = factsFile.lastModified();

        write(factsFile, minimal("\"a\", \"longer\""));
        assertTrue(factsFile.setLastModified(lastModified));

        Facts second = Facts.read(factsFile);
        assertNotSame(first, second);
        assertEquals(Arrays.asList("a", "longer"), new ArrayList<>(second.getCapabilities()));
    }

    @Test
    void readReparsesWhenContentChangesWithSameLengthAndModificationTime() throws IOException {
        write(factsFile, minimal("\"a\""));
        Facts first = Facts.read(factsFile);
        long lastModified = factsFile.lastModified();

        write(factsFile, minimal("\"b\""));
        assertTrue(factsFile.setLastModified(lastModified));

        Facts second = Facts.read(factsFile);
        assertNotSame(first, second);
        assertEquals(Collections.singleton("b"), second.getCapabilities());
    }

    @Test
    void readReusesResultWhenOnlyModificationTimeChanges() throws IOException {
        write(factsFile, minimal("\"a\""));
        Facts first = Facts.read(factsFile);

        assertTrue(factsFile.setLastModified(factsFile.lastModified() + 10_000));

        assertSame(first, Facts.read(factsFile));
    }

    @Test
    void readReportsMissingFile() {
        File missing = platformsAndroid.resolve("missing.json").toFile();
        GradleException e = assertThrows(GradleException.class, () -> Facts.read(missing));
        assertTrue(e.getMessage().startsWith("Could not read NativeScript facts file " + missing), e.getMessage());
    }

    @Test
    void readReportsInvalidFacts() throws IOException {
        write(factsFile, "{\"schemaVersion\": 1}");
        GradleException e = assertThrows(GradleException.class, () -> Facts.read(factsFile));
        assertEquals("Invalid NativeScript facts file " + factsFile + ": project must be an object", e.getMessage());
    }

    private static final String PROJECT =
            "{\"root\": \"../..\", \"appDir\": \"../../app\", \"appResourcesDir\": \"../../app/App_Resources\"}";

    private static Map<String, String> pluginFields(String name) {
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("name", "\"" + name + "\"");
        fields.put("packageDir", "\"../../node_modules/" + name + "\"");
        fields.put("nativeDir", "\"../../node_modules/" + name + "/platforms/android\"");
        fields.put("aarName", "\"" + name + "\"");
        fields.put("aar", "\"../../node_modules/" + name + "/platforms/android/" + name + ".aar\"");
        fields.put("dependencies", "[]");
        fields.put("options", "{}");
        return fields;
    }

    private static String object(Map<String, String> fields) {
        return fields.entrySet().stream()
                .map(e -> "\"" + e.getKey() + "\": " + e.getValue())
                .collect(Collectors.joining(", ", "{", "}"));
    }

    private static String document(String project, String plugins) {
        return document("1", project, plugins);
    }

    private static final String EMPTY_ARRAY_SHA256 = "37517e5f3dc66819f61f5a7bb8ace1921282415f10551d2defa5c3eb0985b570";

    @Test
    void sha256IsLowercaseHex() {
        assertEquals(EMPTY_ARRAY_SHA256, Facts.sha256("[]\n".getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void readsDependenciesJsonHash() throws IOException {
        copyResource("/facts/v1-basic.json", factsFile.toPath());

        assertEquals(EMPTY_ARRAY_SHA256, Facts.read(factsFile).getDependenciesJsonSha256());
    }

    @Test
    void toleratesMissingDependenciesJsonHash() {
        assertEquals(null, parse(minimal("")).getDependenciesJsonSha256());
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "\"x\"",
        "{}",
        "{\"sha256\": 1}",
        "{\"sha256\": \"37517E5F3DC66819F61F5A7BB8ACE1921282415F10551D2DEFA5C3EB0985B570\"}",
        "{\"sha256\": \"37517e5f\"}"
    })
    void rejectsMalformedDependenciesJsonHash(String value) {
        GradleException e = assertThrows(GradleException.class, () -> parse(withHash(value)));
        assertTrue(e.getMessage().startsWith("Invalid NativeScript facts file " + factsFile + ": dependenciesJson"),
                e.getMessage());
    }

    @Test
    void currentWhenDependenciesJsonMatches() throws IOException {
        write(platformsAndroid.resolve("dependencies.json").toFile(), "[]\n");

        assertEquals(null, parse(withHash("{\"sha256\": \"" + EMPTY_ARRAY_SHA256 + "\"}")).staleness());
    }

    @Test
    void staleWhenDependenciesJsonDiffers() throws IOException {
        File dependenciesJson = platformsAndroid.resolve("dependencies.json").toFile();
        write(dependenciesJson, "[ ]\n");

        assertEquals("it does not match " + dependenciesJson + ", which a different NativeScript CLI wrote",
                parse(withHash("{\"sha256\": \"" + EMPTY_ARRAY_SHA256 + "\"}")).staleness());
    }

    @Test
    void staleWhenDependenciesJsonIsMissing() {
        File dependenciesJson = platformsAndroid.resolve("dependencies.json").toFile();

        assertEquals("there is no " + dependenciesJson + " next to it",
                parse(withHash("{\"sha256\": \"" + EMPTY_ARRAY_SHA256 + "\"}")).staleness());
    }

    @Test
    void trustedWithoutHashWhateverDependenciesJsonHolds() throws IOException {
        assertEquals(null, parse(minimal("")).staleness());
        write(platformsAndroid.resolve("dependencies.json").toFile(), "[{\"name\": \"other\"}]");
        assertEquals(null, parse(minimal("")).staleness());
    }

    private static String withHash(String dependenciesJson) {
        return "{\"schemaVersion\": 1, \"dependenciesJson\": " + dependenciesJson + ", \"project\": " + PROJECT
                + ", \"plugins\": []}";
    }

    private static String document(String schemaVersion, String project, String plugins) {
        return "{\"schemaVersion\": " + schemaVersion + ", \"project\": " + project + ", \"plugins\": " + plugins + "}";
    }

    private static String minimal(String capabilities) {
        return "{\"schemaVersion\": 1, \"capabilities\": [" + capabilities + "], \"project\": " + PROJECT
                + ", \"plugins\": []}";
    }

    private static String quote(Path path) {
        return "\"" + path.toString().replace("\\", "\\\\") + "\"";
    }

    private Facts parse(String text) {
        return Facts.parse(factsFile, text);
    }

    private void assertInvalid(String text, String problem) {
        GradleException e = assertThrows(GradleException.class, () -> parse(text));
        assertEquals("Invalid NativeScript facts file " + factsFile + ": " + problem, e.getMessage());
    }

    private static void write(File file, String text) throws IOException {
        Files.write(file.toPath(), text.getBytes(StandardCharsets.UTF_8));
    }

    private void copyResource(String name, Path target) throws IOException {
        try (InputStream in = getClass().getResourceAsStream(name)) {
            Files.copy(in, target);
        }
    }
}
