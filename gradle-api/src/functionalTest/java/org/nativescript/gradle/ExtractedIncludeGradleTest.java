package org.nativescript.gradle;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * The golden file the plugin build test appends must be what the CLI extracts from the sample's
 * include.gradle; the CLI's own tests check it produces the same file.
 */
class ExtractedIncludeGradleTest {
    @Test
    void goldenFileMatchesTheSample() throws Exception {
        String includeGradle = Fixtures.read(Fixtures.samplesDir().resolve("sample-plugin/platforms/android/include.gradle"));
        String golden = Fixtures.read(PluginBuildTest.extractedIncludeGradle());

        assertEquals(golden, String.join("\n", extract(includeGradle)));
    }

    // A port of getIncludeGradleCompileDependenciesScope and getScope in
    // lib/services/android-plugin-build-service.ts.
    private static List<String> extract(String content) {
        List<String> result = new ArrayList<>();
        if (content.indexOf("dependencies") == -1) {
            return result;
        }
        if (content.indexOf("repositories") >= 0) {
            result.add(scope("repositories", content));
        }
        result.add(scope("dependencies", content));
        return result;
    }

    private static String scope(String name, String content) {
        StringBuilder result = new StringBuilder();
        boolean foundFirstBracket = false;
        int openBrackets = 0;
        for (int i = content.indexOf(name); i != -1 && i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '{') {
                if (openBrackets == 0) {
                    foundFirstBracket = true;
                }
                openBrackets++;
            }
            if (c == '}') {
                openBrackets--;
            }
            result.append(c);
            if (openBrackets == 0 && foundFirstBracket) {
                break;
            }
        }
        return result.toString();
    }
}
