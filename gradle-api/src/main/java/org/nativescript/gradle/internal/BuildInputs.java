package org.nativescript.gradle.internal;

import java.io.File;
import org.gradle.api.Project;
import org.gradle.api.plugins.ExtraPropertiesExtension;
import org.gradle.api.provider.ProviderFactory;

/** What {@link Resolution} reads from the build. */
public interface BuildInputs {
    /**
     * An extra property of the project or, failing that, of its nearest ancestor that has one; else
     * a Gradle property ({@code -P}, gradle.properties). Null when absent.
     */
    Object property(String name);

    /** An environment variable, null when absent or empty. */
    String environmentVariable(String name);

    /** The root project's directory. */
    File rootDir();

    static BuildInputs of(Project project) {
        ProviderFactory providers = project.getProviders();
        File rootDir = project.getRootDir();
        return new BuildInputs() {
            // Not Project.findProperty: its implicit lookup in parent projects is deprecated since
            // Gradle 9.x, and the templates set their extra properties on the root project.
            @Override
            public Object property(String name) {
                for (Project p = project; p != null; p = p.getParent()) {
                    ExtraPropertiesExtension extra = p.getExtensions().getExtraProperties();
                    if (extra.has(name)) {
                        return extra.get(name);
                    }
                }
                return providers.gradleProperty(name).getOrNull();
            }

            @Override
            public String environmentVariable(String name) {
                String value = providers.environmentVariable(name).getOrNull();
                return value == null || value.isEmpty() ? null : value;
            }

            @Override
            public File rootDir() {
                return rootDir;
            }
        };
    }
}
