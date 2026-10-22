package org.nativescript.gradle;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.gradle.testkit.runner.BuildResult;

final class Fixtures {
    static final String SAMPLE_NAME = "@nativescript/gradle-api-sample";

    private Fixtures() {}

    static String requiredProperty(String name) {
        String value = System.getProperty(name);
        if (value == null || value.isEmpty()) {
            throw new IllegalStateException("System property " + name + " is not set; run through the functionalTest task.");
        }
        return value;
    }

    static Path testRepo() {
        return Path.of(requiredProperty("nativescript.testRepo"));
    }

    static String libraryVersion() {
        return requiredProperty("nativescript.libraryVersion");
    }

    static Path samplesDir() {
        return Path.of(requiredProperty("nativescript.samplesDir"));
    }

    static Path vendorGradlePluginDir() {
        return Path.of(requiredProperty("nativescript.vendorGradlePluginDir"));
    }

    static List<String> gradleVersions() {
        return Arrays.asList(requiredProperty("nativescript.gradleVersions").split(","));
    }

    /** Makes every buildscript resolve the library from the test repository first. */
    static Path writeInitScript(Path dir) {
        String repo = testRepo().toUri().toString();
        return write(dir.resolve("test-repo.init.gradle"), String.join("\n",
                "allprojects {",
                "    buildscript {",
                "        repositories {",
                "            maven { url = '" + repo + "' }",
                "        }",
                "    }",
                "}",
                ""));
    }

    /** Copies the sample plugin into node_modules, pointing its buildscript at the version under test. */
    static Path installSample(Path projectDir) {
        Path target = projectDir.resolve("node_modules").resolve(SAMPLE_NAME);
        copyTree(samplesDir().resolve("sample-plugin"), target);
        Path buildscript = target.resolve("platforms/android/buildscript.gradle");
        String text = read(buildscript);
        String replaced = text.replaceAll("org\\.nativescript:gradle-api:[^\"']+", "org.nativescript:gradle-api:" + libraryVersion());
        if (replaced.equals(text) && !text.contains(libraryVersion())) {
            throw new IllegalStateException("No org.nativescript:gradle-api classpath dependency in " + buildscript);
        }
        write(buildscript, replaced);
        return target;
    }

    /** A stand-in for @nativescript/core: a package whose native directory holds archives. */
    static Path installCore(Path projectDir) {
        Path core = projectDir.resolve("node_modules/@nativescript/core");
        write(core.resolve("package.json"), "{ \"name\": \"@nativescript/core\", \"version\": \"9.0.0\" }\n");
        write(core.resolve("platforms/android/widgets-release.aar"), "not really an aar");
        write(core.resolve("platforms/android/nested/inner.aar"), "not really an aar");
        return core;
    }

    static Path write(Path file, String content) {
        try {
            Files.createDirectories(file.getParent());
            Files.write(file, content.getBytes(StandardCharsets.UTF_8));
            return file;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static String read(Path file) {
        try {
            return new String(Files.readAllBytes(file), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    static void copyTree(Path source, Path target) {
        try (Stream<Path> paths = Files.walk(source)) {
            for (Path path : paths.collect(Collectors.toList())) {
                Path destination = target.resolve(source.relativize(path).toString());
                if (Files.isDirectory(path)) {
                    Files.createDirectories(destination);
                } else {
                    Files.createDirectories(destination.getParent());
                    Files.copy(path, destination, StandardCopyOption.REPLACE_EXISTING);
                }
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Lines printed as {@code NS|key|value}, by key. A key printed twice must print the same value. */
    static Map<String, String> probes(BuildResult result) {
        Map<String, String> values = new LinkedHashMap<>();
        for (String line : result.getOutput().split("\\R")) {
            if (!line.startsWith("NS|")) {
                continue;
            }
            String[] parts = line.split("\\|", 3);
            String previous = values.put(parts[1], parts.length > 2 ? parts[2] : "");
            if (previous != null && !previous.equals(values.get(parts[1]))) {
                throw new AssertionError("Probe " + parts[1] + " printed both '" + previous + "' and '" + values.get(parts[1]) + "'");
            }
        }
        return values;
    }

    static String sha256(Path file) {
        try {
            StringBuilder hex = new StringBuilder();
            for (byte b : MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(file))) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    static String path(Path path) {
        return path.toAbsolutePath().normalize().toFile().getPath();
    }

    static String path(File file) {
        return path(file.toPath());
    }
}
