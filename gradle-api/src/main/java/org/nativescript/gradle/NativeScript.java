package org.nativescript.gradle;

import org.gradle.api.GradleException;
import org.gradle.api.Project;

/**
 * Entry point for Java and Kotlin code, such as another Gradle plugin built on this library.
 *
 * <p>Scripts applied with {@code apply from}, which include every plugin's {@code include.gradle},
 * get their own class loader and cannot see this class even when {@code buildscript.gradle} put the
 * library on the project's classpath. They apply the plugin by id and use the extension
 * dynamically, through {@code project.extensions.getByName("nativescript")}.
 */
public final class NativeScript {
    private NativeScript() {}

    /**
     * The {@value NativeScriptExtension#NAME} extension of {@code project}, applying {@link
     * NativeScriptPlugin} first if needed.
     *
     * @param project the project, normally {@code :app} in the app build
     * @return the extension
     * @throws GradleException if the project's extension comes from another copy of this library,
     *     loaded by a different class loader
     */
    public static NativeScriptExtension of(Project project) {
        Object extension = project.getExtensions().findByName(NativeScriptExtension.NAME);
        if (extension == null) {
            project.getPluginManager().apply(NativeScriptPlugin.class);
            extension = project.getExtensions().getByName(NativeScriptExtension.NAME);
        }
        if (extension instanceof NativeScriptExtension) {
            return (NativeScriptExtension) extension;
        }
        throw new GradleException("The '" + NativeScriptExtension.NAME + "' extension of " + project
                + " is a " + extension.getClass().getName() + " (class loader " + extension.getClass().getClassLoader()
                + "), not this copy of org.nativescript:gradle-api's " + NativeScriptExtension.class.getName()
                + ". Either something else registered an extension of that name, or another copy of the library"
                + " in a different class loader did; then put the library on the classpath of the buildscript that"
                + " applies it, or use the extension dynamically through project.extensions.getByName(\""
                + NativeScriptExtension.NAME + "\").");
    }
}
