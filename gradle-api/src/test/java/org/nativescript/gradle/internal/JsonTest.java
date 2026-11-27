package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class JsonTest {
    private static final String MIXED_512_LEVELS = "{\"a\":[".repeat(256) + "]}".repeat(256);

    static Stream<Arguments> validDocuments() {
        return Stream.of(
                Arguments.of("true", true),
                Arguments.of("false", false),
                Arguments.of("null", null),
                Arguments.of("\"\"", ""),
                Arguments.of("{ \n }", Collections.emptyMap()),
                Arguments.of("[\t]", Collections.emptyList()),
                Arguments.of("0", 0),
                Arguments.of("-0", 0),
                Arguments.of("2147483647", Integer.MAX_VALUE),
                Arguments.of("-2147483648", Integer.MIN_VALUE),
                Arguments.of("2147483648", 2147483648L),
                Arguments.of("-2147483649", -2147483649L),
                Arguments.of("9223372036854775807", Long.MAX_VALUE),
                Arguments.of("-9223372036854775808", Long.MIN_VALUE),
                Arguments.of("9223372036854775808", new BigInteger("9223372036854775808")),
                Arguments.of("-9223372036854775809", new BigInteger("-9223372036854775809")),
                Arguments.of("1.0", new BigDecimal("1.0")),
                Arguments.of("-0.25", new BigDecimal("-0.25")),
                Arguments.of("1e3", new BigDecimal("1e3")),
                Arguments.of("3.5E+2", new BigDecimal("3.5E+2")),
                Arguments.of("2e-2", new BigDecimal("2e-2")),
                Arguments.of("\"\\\"\\\\\\/\\b\\f\\n\\r\\t\"", "\"\\/\b\f\n\r\t"),
                Arguments.of("\"\\u00e9\\u00E9\"", "\u00e9\u00e9"),
                Arguments.of("\"\\uD83D\\uDE00\"", "\uD83D\uDE00"),
                Arguments.of("\"a\\u0000b\"", "a\u0000b"),
                Arguments.of("\"caf\u00e9 \uD83D\uDE00 \u65e5\u672c\"", "caf\u00e9 \uD83D\uDE00 \u65e5\u672c"),
                Arguments.of("\uFEFF 1 ", 1),
                Arguments.of(" \t\r\n[ 1 ,\n\t2\r\n]\n ", Arrays.asList(1, 2)),
                Arguments.of("{\n\t\"a\"\r\n :\t\"b\" }", Collections.singletonMap("a", "b")),
                Arguments.of(
                        "{\"a\": [1, {\"b\": null, \"c\": [true]}], \"d\": {\"e\": {}}, \"f\": [[]]}",
                        map("a", Arrays.asList(1, map("b", null, "c", List.of(true))),
                                "d", map("e", Collections.emptyMap()),
                                "f", List.of(List.of()))));
    }

    @ParameterizedTest
    @MethodSource("validDocuments")
    void parses(String text, Object expected) {
        assertEquals(expected, Json.parse(text));
    }

    @Test
    void keepsKeyOrderAndTheLastValueOfARepeatedKey() {
        Map<String, Object> map = asMap(Json.parse("{\"z\": 1, \"a\": 2, \"z\": 3}"));
        assertEquals(Arrays.asList("z", "a"), new ArrayList<>(map.keySet()));
        assertEquals(3, map.get("z"));
    }

    @Test
    void resultsAreUnmodifiable() {
        List<Object> list = asList(Json.parse("[[1], [], {\"k\": 1}, {}]"));
        assertThrows(UnsupportedOperationException.class, () -> list.add(0));
        assertThrows(UnsupportedOperationException.class, () -> asList(list.get(1)).add(0));
        assertThrows(UnsupportedOperationException.class, () -> asMap(list.get(2)).put("x", 1));
        assertThrows(UnsupportedOperationException.class, () -> asMap(list.get(3)).put("x", 1));
    }

    @Test
    void acceptsNestingOf512Levels() {
        Json.parse("[".repeat(512) + "]".repeat(512));
        Json.parse(MIXED_512_LEVELS);
    }

    static Stream<Arguments> invalidDocuments() {
        return Stream.of(
                Arguments.of("trailing comma in object", "{\"a\":1,}", 7, 1, 8, "expected a string key"),
                Arguments.of("trailing comma in array", "[1,]", 3, 1, 4, "expected a value"),
                Arguments.of("leading zero", "01", 1, 1, 2, "Leading zeros"),
                Arguments.of("no digit after dot", "1.", 2, 1, 3, "after '.'"),
                Arguments.of("no exponent digit after sign", "1e+", 3, 1, 4, "exponent"),
                Arguments.of("lone minus", "-", 1, 1, 2, "expected a digit"),
                Arguments.of("leading plus", "+1", 0, 1, 1, "expected a value"),
                Arguments.of("unterminated string", "\"abc", 4, 1, 5, "Unterminated string"),
                Arguments.of("unterminated after backslash", "\"abc\\", 5, 1, 6, "Unterminated string"),
                Arguments.of("raw newline in string", "\"a\nb\"", 2, 1, 3, "U+000A"),
                Arguments.of("invalid escape", "\"\\x\"", 2, 1, 3, "Invalid escape sequence '\\x'"),
                Arguments.of("bad hex digit", "\"\\u12G4\"", 5, 1, 6, "Invalid hex digit character 'G'"),
                Arguments.of("incomplete unicode escape", "\"\\u12\"", 2, 1, 3, "Incomplete \\u escape"),
                Arguments.of("single quotes", "'a'", 0, 1, 1, "character '''"),
                Arguments.of("NaN", "NaN", 0, 1, 1, "expected a value"),
                Arguments.of("Infinity", "-Infinity", 1, 1, 2, "expected a digit"),
                Arguments.of("misspelled literal", "nul1", 3, 1, 4, "expected 'null'"),
                Arguments.of("trailing garbage", "{} x", 3, 1, 4, "after the JSON value"),
                Arguments.of("comment", "[1] // no", 4, 1, 5, "after the JSON value"),
                Arguments.of("empty input", "", 0, 1, 1, "end of input"),
                Arguments.of("missing colon", "{\"a\" 1}", 5, 1, 6, "expected ':'"),
                Arguments.of("unquoted key", "{a:1}", 1, 1, 2, "expected a string key"),
                Arguments.of("missing comma in array", "[1 2]", 3, 1, 4, "expected ',' or ']'"),
                Arguments.of("missing comma in object", "{\"a\":1 \"b\":2}", 7, 1, 8, "expected ',' or '}'"),
                Arguments.of("unclosed array", "[1", 2, 1, 3, "end of input"),
                Arguments.of("unclosed object", "{\"a\":1", 6, 1, 7, "end of input"),
                Arguments.of("multi-line", "{\n  \"a\": 1,\n  \"b\": x\n}", 19, 3, 8, "character 'x'"),
                Arguments.of("CRLF line ending", "[\r\n x]", 4, 2, 2, "character 'x'"),
                Arguments.of("byte order mark after whitespace", " \uFEFF1", 1, 1, 2, "expected a value"),
                Arguments.of("form feed", "\f1", 0, 1, 1, "character U+000C"),
                Arguments.of("no-break space", "\u00a01", 0, 1, 1, "expected a value"),
                Arguments.of("vertical tab", "1\u000b", 1, 1, 2, "character U+000B after the JSON value"),
                Arguments.of("513 nested arrays", "[".repeat(513) + "]".repeat(513), 512, 1, 513, "Nesting deeper"),
                Arguments.of("513 nested mixed", "[" + MIXED_512_LEVELS + "]", 1536, 1, 1537, "Nesting deeper"));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("invalidDocuments")
    void reportsWhereInvalidJsonFails(
            String description, String text, int offset, int line, int column, String messagePart) {
        Json.ParseException e = assertThrows(Json.ParseException.class, () -> Json.parse(text));
        assertEquals(offset, e.getOffset(), "offset");
        assertEquals(line, e.getLine(), "line");
        assertEquals(column, e.getColumn(), "column");
        assertTrue(e.getMessage().contains(messagePart), e.getMessage());
        assertTrue(e.getMessage().endsWith(" at line " + line + ", column " + column), e.getMessage());
    }

    private static Map<String, Object> map(Object... keysAndValues) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < keysAndValues.length; i += 2) {
            map.put((String) keysAndValues[i], keysAndValues[i + 1]);
        }
        return map;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> asMap(Object value) {
        return (Map<String, Object>) assertInstanceOf(Map.class, value);
    }

    @SuppressWarnings("unchecked")
    private static List<Object> asList(Object value) {
        return (List<Object>) assertInstanceOf(List.class, value);
    }
}
