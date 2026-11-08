package org.nativescript.gradle.internal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;

class JsonTest {

    @Test
    void parsesLiterals() {
        assertEquals(Boolean.TRUE, Json.parse("true"));
        assertEquals(Boolean.FALSE, Json.parse("false"));
        assertNull(Json.parse("null"));
        assertEquals("hello", Json.parse("\"hello\""));
        assertEquals("", Json.parse("\"\""));
        assertEquals(42, Json.parse("42"));
    }

    @Test
    void parsesEmptyContainers() {
        assertEquals(Collections.emptyMap(), Json.parse("{}"));
        assertEquals(Collections.emptyList(), Json.parse("[]"));
        assertEquals(Collections.emptyMap(), Json.parse("{ \n }"));
        assertEquals(Collections.emptyList(), Json.parse("[\t]"));
    }

    @Test
    void parsesNestedStructures() {
        Object value = Json.parse(
                "{\"a\": [1, {\"b\": null, \"c\": [true, false]}, \"s\"], \"d\": {\"e\": {}}, \"f\": [[]]}");

        Map<String, Object> root = asMap(value);
        assertEquals(Arrays.asList("a", "d", "f"), new ArrayList<>(root.keySet()));
        List<Object> a = asList(root.get("a"));
        assertEquals(3, a.size());
        assertEquals(1, a.get(0));
        Map<String, Object> inner = asMap(a.get(1));
        assertTrue(inner.containsKey("b"));
        assertNull(inner.get("b"));
        assertEquals(Arrays.asList(true, false), inner.get("c"));
        assertEquals("s", a.get(2));
        assertEquals(Collections.emptyMap(), asMap(root.get("d")).get("e"));
        assertEquals(Collections.singletonList(Collections.emptyList()), root.get("f"));
    }

    @Test
    void keepsObjectKeyOrder() {
        Map<String, Object> map = asMap(Json.parse("{\"z\": 1, \"a\": 2, \"m\": 3}"));
        assertEquals(Arrays.asList("z", "a", "m"), new ArrayList<>(map.keySet()));
    }

    @Test
    void repeatedKeyKeepsLastValueAtFirstPosition() {
        Map<String, Object> map = asMap(Json.parse("{\"a\": 1, \"b\": 2, \"a\": 3}"));
        assertEquals(3, map.get("a"));
        assertEquals(Arrays.asList("a", "b"), new ArrayList<>(map.keySet()));
    }

    @Test
    void resultsAreUnmodifiable() {
        Map<String, Object> map = asMap(Json.parse("{\"a\": [1], \"b\": {}}"));
        assertThrows(UnsupportedOperationException.class, () -> map.put("c", 1));
        assertThrows(UnsupportedOperationException.class, () -> asList(map.get("a")).add(2));
        assertThrows(UnsupportedOperationException.class, () -> asMap(map.get("b")).put("x", 1));
        assertThrows(UnsupportedOperationException.class, () -> asMap(Json.parse("{}")).put("x", 1));
        assertThrows(UnsupportedOperationException.class, () -> asList(Json.parse("[]")).add(1));
    }

    @Test
    void integersUseTheSmallestTypeThatFits() {
        assertEquals(Integer.valueOf(0), Json.parse("0"));
        assertEquals(Integer.valueOf(0), Json.parse("-0"));
        assertEquals(Integer.valueOf(Integer.MAX_VALUE), Json.parse("2147483647"));
        assertEquals(Integer.valueOf(Integer.MIN_VALUE), Json.parse("-2147483648"));
        assertEquals(Long.valueOf(2147483648L), Json.parse("2147483648"));
        assertEquals(Long.valueOf(-2147483649L), Json.parse("-2147483649"));
        assertEquals(Long.valueOf(Long.MAX_VALUE), Json.parse("9223372036854775807"));
        assertEquals(Long.valueOf(Long.MIN_VALUE), Json.parse("-9223372036854775808"));
        assertEquals(new BigInteger("9223372036854775808"), Json.parse("9223372036854775808"));
        assertEquals(new BigInteger("-9223372036854775809"), Json.parse("-9223372036854775809"));
        assertEquals(new BigInteger("123456789012345678901234567890"), Json.parse("123456789012345678901234567890"));
    }

    @Test
    void fractionsAndExponentsAreBigDecimals() {
        assertEquals(new BigDecimal("1.5"), Json.parse("1.5"));
        assertEquals(new BigDecimal("-0.25"), Json.parse("-0.25"));
        assertEquals(new BigDecimal("1e3"), Json.parse("1e3"));
        assertEquals(new BigDecimal("3.5E+2"), Json.parse("3.5E+2"));
        assertEquals(new BigDecimal("2e-2"), Json.parse("2e-2"));
        assertInstanceOf(BigDecimal.class, Json.parse("1.0"));
        assertInstanceOf(BigDecimal.class, Json.parse("-0.0"));
        assertEquals(0, new BigDecimal("350").compareTo((BigDecimal) Json.parse("3.5E+2")));
    }

    @Test
    void decodesEscapes() {
        assertEquals("\"\\/\b\f\n\r\t", Json.parse("\"\\\"\\\\\\/\\b\\f\\n\\r\\t\""));
        assertEquals("\u00e9", Json.parse("\"\\u00e9\""));
        assertEquals("\u00e9", Json.parse("\"\\u00E9\""));
        assertEquals("\uD83D\uDE00", Json.parse("\"\\uD83D\\uDE00\""));
        assertEquals("a\u0000b", Json.parse("\"a\\u0000b\""));
        assertEquals("x\ny", Json.parse("\"x\\u000ay\""));
    }

    @Test
    void passesThroughNonAsciiCharacters() {
        assertEquals("caf\u00e9 \uD83D\uDE00 \u65e5\u672c", Json.parse("\"caf\u00e9 \uD83D\uDE00 \u65e5\u672c\""));
    }

    @Test
    void skipsLeadingByteOrderMark() {
        assertEquals(Collections.emptyMap(), Json.parse("\uFEFF{}"));
        assertEquals(1, Json.parse("\uFEFF 1 "));
    }

    @Test
    void byteOrderMarkIsOnlySkippedAtTheStart() {
        Json.ParseException e = assertThrows(Json.ParseException.class, () -> Json.parse(" \uFEFF1"));
        assertEquals(1, e.getOffset());
    }

    @Test
    void skipsJsonWhitespace() {
        assertEquals(Arrays.asList(1, 2), Json.parse(" \t\r\n[ 1 ,\n\t2\r\n]\n "));
        assertEquals(Collections.singletonMap("a", "b"), Json.parse("{\n\t\"a\"\r\n :\t\"b\" }"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"\f1", "\u00a01", "1\u000b"})
    void rejectsNonJsonWhitespace(String text) {
        assertThrows(Json.ParseException.class, () -> Json.parse(text));
    }

    @Test
    void acceptsNestingOf512Levels() {
        String text = "[".repeat(512) + "]".repeat(512);
        Object value = Json.parse(text);
        for (int i = 0; i < 511; i++) {
            value = asList(value).get(0);
        }
        assertEquals(Collections.emptyList(), value);
    }

    @Test
    void rejectsNestingOf513Levels() {
        Json.ParseException e = assertThrows(
                Json.ParseException.class, () -> Json.parse("[".repeat(513) + "]".repeat(513)));
        assertEquals(512, e.getOffset());
        assertTrue(e.getMessage().startsWith("Nesting deeper than 512 levels"), e.getMessage());
    }

    @Test
    void depthCountsObjectsAndArraysTogether() {
        StringBuilder ok = new StringBuilder();
        for (int i = 0; i < 256; i++) {
            ok.append("{\"a\":[");
        }
        ok.append("]}".repeat(256));
        Json.parse(ok.toString());

        Json.ParseException e = assertThrows(Json.ParseException.class, () -> Json.parse("[" + ok + "]"));
        assertTrue(e.getMessage().startsWith("Nesting deeper"), e.getMessage());
    }

    static Stream<Arguments> invalidDocuments() {
        return Stream.of(
                Arguments.of("trailing comma in object", "{\"a\":1,}", 7, 1, 8, "expected a string key"),
                Arguments.of("trailing comma in array", "[1,]", 3, 1, 4, "expected a value"),
                Arguments.of("leading zero", "01", 1, 1, 2, "Leading zeros"),
                Arguments.of("negative leading zero", "-01", 2, 1, 3, "Leading zeros"),
                Arguments.of("no digit after dot", "1.", 2, 1, 3, "after '.'"),
                Arguments.of("no exponent digit", "1e", 2, 1, 3, "exponent"),
                Arguments.of("no exponent digit after sign", "1e+", 3, 1, 4, "exponent"),
                Arguments.of("lone minus", "-", 1, 1, 2, "expected a digit"),
                Arguments.of("leading plus", "+1", 0, 1, 1, "expected a value"),
                Arguments.of("leading dot", ".5", 0, 1, 1, "expected a value"),
                Arguments.of("unterminated string", "\"abc", 4, 1, 5, "Unterminated string"),
                Arguments.of("unterminated after backslash", "\"abc\\", 5, 1, 6, "Unterminated string"),
                Arguments.of("raw tab in string", "\"a\tb\"", 2, 1, 3, "U+0009"),
                Arguments.of("raw newline in string", "\"a\nb\"", 2, 1, 3, "U+000A"),
                Arguments.of("invalid escape", "\"\\x\"", 2, 1, 3, "Invalid escape sequence '\\x'"),
                Arguments.of("bad hex digit", "\"\\u12G4\"", 5, 1, 6, "Invalid hex digit character 'G'"),
                Arguments.of("single quotes", "'a'", 0, 1, 1, "character '''"),
                Arguments.of("NaN", "NaN", 0, 1, 1, "expected a value"),
                Arguments.of("Infinity", "-Infinity", 1, 1, 2, "expected a digit"),
                Arguments.of("truncated literal", "tru", 3, 1, 4, "expected 'true'"),
                Arguments.of("misspelled literal", "nul1", 3, 1, 4, "expected 'null'"),
                Arguments.of("trailing garbage", "{} x", 3, 1, 4, "after the JSON value"),
                Arguments.of("two values", "1 2", 2, 1, 3, "after the JSON value"),
                Arguments.of("empty input", "", 0, 1, 1, "end of input"),
                Arguments.of("whitespace only", "  \n ", 4, 2, 2, "end of input"),
                Arguments.of("missing colon", "{\"a\" 1}", 5, 1, 6, "expected ':'"),
                Arguments.of("unquoted key", "{a:1}", 1, 1, 2, "expected a string key"),
                Arguments.of("missing comma in array", "[1 2]", 3, 1, 4, "expected ',' or ']'"),
                Arguments.of("missing comma in object", "{\"a\":1 \"b\":2}", 7, 1, 8, "expected ',' or '}'"),
                Arguments.of("unclosed array", "[1", 2, 1, 3, "end of input"),
                Arguments.of("unclosed object", "{\"a\":1", 6, 1, 7, "end of input"),
                Arguments.of("comment", "[1] // no", 4, 1, 5, "after the JSON value"),
                Arguments.of("multi-line", "{\n  \"a\": 1,\n  \"b\": x\n}", 19, 3, 8, "character 'x'"),
                Arguments.of("CRLF line ending", "[\r\n x]", 4, 2, 2, "character 'x'"));
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

    @Test
    void rejectsIncompleteUnicodeEscape() {
        Json.ParseException e = assertThrows(Json.ParseException.class, () -> Json.parse("\"\\u12\""));
        assertTrue(e.getMessage().startsWith("Incomplete \\u escape"), e.getMessage());
    }

    @Test
    void describesControlCharactersByCodePoint() {
        Json.ParseException e = assertThrows(Json.ParseException.class, () -> Json.parse("[1\u0001]"));
        assertTrue(e.getMessage().contains("character U+0001"), e.getMessage());
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
