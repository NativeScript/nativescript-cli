package org.nativescript.gradle;

import java.io.ByteArrayOutputStream;
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
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;
import javax.tools.JavaCompiler;
import javax.tools.ToolProvider;
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

    static Path libraryJar() {
        return Path.of(requiredProperty("nativescript.libraryJar"));
    }

    /** A version of the library above any real one, published by {@link #writeHighVersionRepo(Path)}. */
    static final String HIGH_LIBRARY_VERSION = "99.0.0";

    /** Writes a Maven repository holding the library under test as {@link #HIGH_LIBRARY_VERSION}. */
    static Path writeHighVersionRepo(Path dir) {
        Path versionDir = dir.resolve("org/nativescript/gradle-api").resolve(HIGH_LIBRARY_VERSION);
        String baseName = "gradle-api-" + HIGH_LIBRARY_VERSION;
        try {
            Files.createDirectories(versionDir);
            Files.copy(libraryJar(), versionDir.resolve(baseName + ".jar"), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        write(versionDir.resolve(baseName + ".pom"), String.join("\n",
                "<project xmlns=\"http://maven.apache.org/POM/4.0.0\">",
                "  <modelVersion>4.0.0</modelVersion>",
                "  <groupId>org.nativescript</groupId>",
                "  <artifactId>gradle-api</artifactId>",
                "  <version>" + HIGH_LIBRARY_VERSION + "</version>",
                "</project>",
                ""));
        return dir;
    }

    /** Makes every buildscript resolve the library from the test repository, then {@code moreRepos}, first. */
    static Path writeInitScript(Path dir, Path... moreRepos) {
        StringBuilder repos = new StringBuilder();
        for (Path repo : Stream.concat(Stream.of(testRepo()), Stream.of(moreRepos)).collect(Collectors.toList())) {
            repos.append("            maven { url = '").append(repo.toUri()).append("' }\n");
        }
        return write(dir.resolve("test-repo.init.gradle"), String.join("\n",
                "allprojects {",
                "    buildscript {",
                "        repositories {",
                repos + "        }",
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

    /**
     * A stand-in for @nativescript/core: a package whose native directory holds Android libraries,
     * one of them below the top level. {@code widgets-release.aar} contains {@link #CORE_CLASS}.
     */
    static Path installCore(Path projectDir) {
        Path core = projectDir.resolve("node_modules/@nativescript/core");
        write(core.resolve("package.json"), "{ \"name\": \"@nativescript/core\", \"version\": \"9.0.0\" }\n");
        Path classes = projectDir.resolve("core-classes");
        writeAar(core.resolve("platforms/android/widgets-release.aar"), compile(classes, CORE_CLASS));
        writeAar(core.resolve("platforms/android/nested/inner.aar"), compile(classes, "org.nativescript.widgets.nested.Inner"));
        return core;
    }

    static final String CORE_CLASS = "org.nativescript.widgets.Probe";

    private static Map<String, byte[]> compile(Path workDir, String className) {
        JavaCompiler javac = ToolProvider.getSystemJavaCompiler();
        if (javac == null) {
            throw new IllegalStateException("The functional tests need a JDK, not a JRE");
        }
        int dot = className.lastIndexOf('.');
        String packageName = className.substring(0, dot);
        String simpleName = className.substring(dot + 1);
        Path out = workDir.resolve(simpleName + "-classes");
        Path source = write(workDir.resolve(simpleName + "-src").resolve(className.replace('.', '/') + ".java"),
                "package " + packageName + ";\npublic final class " + simpleName + " {}\n");
        try {
            Files.createDirectories(out);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        int exit = javac.run(null, null, null, "--release", "11", "-d", path(out), path(source));
        if (exit != 0) {
            throw new IllegalStateException("javac failed for " + source);
        }
        String entry = className.replace('.', '/') + ".class";
        return Map.of(entry, readBytes(out.resolve(entry)));
    }

    private static void writeAar(Path aar, Map<String, byte[]> classes) {
        ByteArrayOutputStream classesJar = new ByteArrayOutputStream();
        try (ZipOutputStream jar = new ZipOutputStream(classesJar)) {
            for (Map.Entry<String, byte[]> entry : classes.entrySet()) {
                putEntry(jar, entry.getKey(), entry.getValue());
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        String packageName = classes.keySet().iterator().next().replaceFirst("/[^/]+$", "").replace('/', '.');
        try {
            Files.createDirectories(aar.getParent());
            try (ZipOutputStream zip = new ZipOutputStream(Files.newOutputStream(aar))) {
                putEntry(zip, "AndroidManifest.xml", ("<manifest xmlns:android=\"http://schemas.android.com/apk/res/android\" package=\""
                        + packageName + "\" />\n").getBytes(StandardCharsets.UTF_8));
                putEntry(zip, "classes.jar", classesJar.toByteArray());
                putEntry(zip, "R.txt", new byte[0]);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void putEntry(ZipOutputStream zip, String name, byte[] content) throws IOException {
        zip.putNextEntry(new ZipEntry(name));
        zip.write(content);
        zip.closeEntry();
    }

    private static byte[] readBytes(Path file) {
        try {
            return Files.readAllBytes(file);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
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
