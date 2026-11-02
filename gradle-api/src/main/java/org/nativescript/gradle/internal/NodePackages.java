package org.nativescript.gradle.internal;

import java.io.File;

/** Node's lookup of installed packages: {@code node_modules/<name>} in a directory or any ancestor. */
public final class NodePackages {
    private NodePackages() {}

    /**
     * The directory of the installed package {@code name} as seen from {@code fromDir}, or null.
     *
     * @throws IllegalArgumentException if {@code name} is not an npm package name
     */
    public static File find(File fromDir, String name) {
        validate(name);
        for (File dir = fromDir.getAbsoluteFile(); dir != null; dir = dir.getParentFile()) {
            File candidate = new File(new File(dir, "node_modules"), name);
            if (new File(candidate, "package.json").isFile()) {
                return candidate.toPath().normalize().toFile();
            }
        }
        return null;
    }

    static void validate(String name) {
        if (name == null || name.isEmpty()) {
            throw new IllegalArgumentException("An npm package name must not be empty");
        }
        String[] parts = name.split("/", -1);
        boolean scoped = name.startsWith("@");
        boolean valid = scoped ? parts.length == 2 && parts[0].length() > 1 : parts.length == 1;
        for (String part : parts) {
            if (part.isEmpty() || part.equals(".") || part.equals("..") || part.indexOf('\\') >= 0 || part.indexOf(':') >= 0) {
                valid = false;
            }
        }
        if (!valid) {
            throw new IllegalArgumentException("'" + name + "' is not an npm package name");
        }
    }
}
