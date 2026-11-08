package org.nativescript.gradle;

import org.gradle.api.Plugin;
import org.gradle.api.Project;
import org.nativescript.gradle.internal.DefaultNativeScriptExtension;

/**
 * Registers the {@value NativeScriptExtension#NAME} extension, plugin id {@code
 * org.nativescript.api}.
 *
 * <p>Every plugin of an app applies this to the same {@code :app} project; applying it again, or
 * when the extension already exists, does nothing.
 */
public class NativeScriptPlugin implements Plugin<Project> {
    /** Creates the plugin; Gradle does this when it is applied. */
    public NativeScriptPlugin() {}

    @Override
    public void apply(Project project) {
        if (project.getExtensions().findByName(NativeScriptExtension.NAME) != null) {
            return;
        }
        project.getExtensions()
                .add(NativeScriptExtension.class, NativeScriptExtension.NAME, new DefaultNativeScriptExtension(project));
    }
}
