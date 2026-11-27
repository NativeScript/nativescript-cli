package org.nativescript.gradle.internal;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

final class TestFiles {
    private TestFiles() {}

    /** Facts for the project at {@code root}, whose app is in {@code src}. */
    static Path writeFacts(Path file, Path root, String plugins, String dependenciesJsonSha256) throws IOException {
        String rootPath = root.toString().replace('\\', '/');
        String hash = dependenciesJsonSha256 != null
                ? "\"dependenciesJson\": {\"sha256\": \"" + dependenciesJsonSha256 + "\"}, "
                : "";
        write(file, "{\"schemaVersion\": 1, " + hash
                + "\"capabilities\": [\"some.capability\"], "
                + "\"project\": {\"root\": \"" + rootPath + "\", \"appDir\": \"" + rootPath + "/src\","
                + " \"appResourcesDir\": \"" + rootPath + "/src/App_Resources\"},"
                + " \"plugins\": " + plugins + "}");
        return file;
    }

    /** A plugin entry whose package is at {@code packageDir}, relative to the facts file. */
    static String plugin(String name, String packageDir) {
        return "{\"name\": \"" + name + "\", \"packageDir\": \"" + packageDir + "\","
                + " \"nativeDir\": \"" + packageDir + "/platforms/android\", \"aarName\": \"" + name.replaceAll("\\W", "_")
                + "\", \"aar\": \"" + packageDir + "/platforms/android/x.aar\", \"dependencies\": []}";
    }

    static Path installPackage(Path dir, String name) throws IOException {
        Path pkg = dir.resolve("node_modules").resolve(name);
        write(pkg.resolve("package.json"), "{\"name\": \"" + name + "\"}");
        return pkg;
    }

    static void write(Path file, String text) throws IOException {
        Files.createDirectories(file.getParent());
        Files.write(file, text.getBytes(StandardCharsets.UTF_8));
    }
}
