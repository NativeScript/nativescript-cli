package org.nativescript.gradle.internal;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Strict RFC 8259 JSON parser.
 *
 * <p>The library must not depend on a JSON library, nor on Groovy's: Gradle 7 ships Groovy 3 and
 * Gradle 8+ ship Groovy 4, under different package names.
 *
 * <p>Objects become unmodifiable {@link LinkedHashMap}s (a repeated key keeps the last value, as
 * {@code JSON.parse} does), arrays unmodifiable lists, integers {@link Integer}, {@link Long} or
 * {@link BigInteger} (the smallest that fits), other numbers {@link BigDecimal}, and {@code null}
 * stays {@code null}. A leading byte order mark is skipped.
 */
public final class Json {
    private static final int MAX_DEPTH = 512;

    private final String text;
    private int pos;
    private int depth;

    private Json(String text) {
        this.text = text;
    }

    /**
     * Parses one JSON value, which must be the whole of {@code text} apart from whitespace.
     *
     * @throws ParseException if {@code text} is not valid JSON
     */
    public static Object parse(String text) {
        Json parser = new Json(text);
        if (!text.isEmpty() && text.charAt(0) == 0xFEFF) {
            parser.pos = 1;
        }
        parser.skipWhitespace();
        Object value = parser.readValue();
        parser.skipWhitespace();
        if (parser.pos < text.length()) {
            throw parser.error("Unexpected " + parser.describeCurrent() + " after the JSON value");
        }
        return value;
    }

    private Object readValue() {
        if (pos >= text.length()) {
            throw error("Unexpected end of input, expected a value");
        }
        char c = text.charAt(pos);
        switch (c) {
            case '{':
                return readObject();
            case '[':
                return readArray();
            case '"':
                return readString();
            case 't':
                expectLiteral("true");
                return Boolean.TRUE;
            case 'f':
                expectLiteral("false");
                return Boolean.FALSE;
            case 'n':
                expectLiteral("null");
                return null;
            default:
                if (c == '-' || (c >= '0' && c <= '9')) {
                    return readNumber();
                }
                throw error("Unexpected " + describeCurrent() + ", expected a value");
        }
    }

    private Map<String, Object> readObject() {
        enter();
        pos++;
        Map<String, Object> result = new LinkedHashMap<>();
        skipWhitespace();
        if (peek() == '}') {
            pos++;
            depth--;
            return Collections.unmodifiableMap(result);
        }
        while (true) {
            skipWhitespace();
            if (peek() != '"') {
                throw error("Unexpected " + describeCurrent() + ", expected a string key");
            }
            String key = readString();
            skipWhitespace();
            expect(':');
            skipWhitespace();
            result.put(key, readValue());
            skipWhitespace();
            if (peek() == ',') {
                pos++;
            } else if (peek() == '}') {
                pos++;
                depth--;
                return Collections.unmodifiableMap(result);
            } else {
                throw error("Unexpected " + describeCurrent() + ", expected ',' or '}'");
            }
        }
    }

    private List<Object> readArray() {
        enter();
        pos++;
        List<Object> result = new ArrayList<>();
        skipWhitespace();
        if (peek() == ']') {
            pos++;
            depth--;
            return Collections.unmodifiableList(result);
        }
        while (true) {
            skipWhitespace();
            result.add(readValue());
            skipWhitespace();
            if (peek() == ',') {
                pos++;
            } else if (peek() == ']') {
                pos++;
                depth--;
                return Collections.unmodifiableList(result);
            } else {
                throw error("Unexpected " + describeCurrent() + ", expected ',' or ']'");
            }
        }
    }

    private String readString() {
        pos++;
        StringBuilder sb = new StringBuilder();
        while (true) {
            if (pos >= text.length()) {
                throw error("Unterminated string");
            }
            char c = text.charAt(pos);
            if (c == '"') {
                pos++;
                return sb.toString();
            }
            if (c < 0x20) {
                throw error("Unescaped control character U+" + String.format("%04X", (int) c) + " in string");
            }
            if (c != '\\') {
                sb.append(c);
                pos++;
                continue;
            }
            pos++;
            if (pos >= text.length()) {
                throw error("Unterminated string");
            }
            char escaped = text.charAt(pos);
            switch (escaped) {
                case '"':
                case '\\':
                case '/':
                    sb.append(escaped);
                    break;
                case 'b':
                    sb.append('\b');
                    break;
                case 'f':
                    sb.append('\f');
                    break;
                case 'n':
                    sb.append('\n');
                    break;
                case 'r':
                    sb.append('\r');
                    break;
                case 't':
                    sb.append('\t');
                    break;
                case 'u':
                    sb.append(readUnicodeEscape());
                    continue;
                default:
                    throw error("Invalid escape sequence '\\" + escaped + "'");
            }
            pos++;
        }
    }

    private char readUnicodeEscape() {
        int start = pos + 1;
        if (start + 4 > text.length()) {
            throw error("Incomplete \\u escape");
        }
        int value = 0;
        for (int i = start; i < start + 4; i++) {
            char c = text.charAt(i);
            int digit = c < 0x80 ? Character.digit(c, 16) : -1;
            if (digit < 0) {
                pos = i;
                throw error("Invalid hex digit " + describeCurrent() + " in \\u escape");
            }
            value = value * 16 + digit;
        }
        pos = start + 4;
        return (char) value;
    }

    private Number readNumber() {
        int start = pos;
        boolean integral = true;
        if (peek() == '-') {
            pos++;
        }
        if (peek() == '0') {
            pos++;
            if (isDigit(peek())) {
                throw error("Leading zeros are not allowed");
            }
        } else if (isDigit(peek())) {
            skipDigits();
        } else {
            throw error("Unexpected " + describeCurrent() + ", expected a digit");
        }
        if (peek() == '.') {
            integral = false;
            pos++;
            if (!isDigit(peek())) {
                throw error("Unexpected " + describeCurrent() + ", expected a digit after '.'");
            }
            skipDigits();
        }
        if (peek() == 'e' || peek() == 'E') {
            integral = false;
            pos++;
            if (peek() == '+' || peek() == '-') {
                pos++;
            }
            if (!isDigit(peek())) {
                throw error("Unexpected " + describeCurrent() + ", expected a digit in the exponent");
            }
            skipDigits();
        }
        String literal = text.substring(start, pos);
        if (!integral) {
            return new BigDecimal(literal);
        }
        BigInteger value = new BigInteger(literal);
        if (value.bitLength() < 32) {
            return value.intValue();
        }
        if (value.bitLength() < 64) {
            return value.longValue();
        }
        return value;
    }

    private void skipDigits() {
        while (isDigit(peek())) {
            pos++;
        }
    }

    private static boolean isDigit(int c) {
        return c >= '0' && c <= '9';
    }

    private void expectLiteral(String literal) {
        for (int i = 0; i < literal.length(); i++) {
            if (peek() != literal.charAt(i)) {
                throw error("Unexpected " + describeCurrent() + ", expected '" + literal + "'");
            }
            pos++;
        }
    }

    private void expect(char c) {
        if (peek() != c) {
            throw error("Unexpected " + describeCurrent() + ", expected '" + c + "'");
        }
        pos++;
    }

    private void enter() {
        if (++depth > MAX_DEPTH) {
            throw error("Nesting deeper than " + MAX_DEPTH + " levels");
        }
    }

    /** The current character, or -1 at the end of the input. */
    private int peek() {
        return pos < text.length() ? text.charAt(pos) : -1;
    }

    private void skipWhitespace() {
        while (pos < text.length()) {
            char c = text.charAt(pos);
            if (c != ' ' && c != '\t' && c != '\n' && c != '\r') {
                return;
            }
            pos++;
        }
    }

    private String describeCurrent() {
        if (pos >= text.length()) {
            return "end of input";
        }
        char c = text.charAt(pos);
        if (c < 0x20 || c == 0x7F) {
            return "character U+" + String.format("%04X", (int) c);
        }
        return "character '" + c + "'";
    }

    private ParseException error(String message) {
        int line = 1;
        int column = 1;
        for (int i = 0; i < pos && i < text.length(); i++) {
            if (text.charAt(i) == '\n') {
                line++;
                column = 1;
            } else {
                column++;
            }
        }
        return new ParseException(message, pos, line, column);
    }

    /** Invalid JSON, with the position of the first offending character. */
    public static final class ParseException extends RuntimeException {
        private static final long serialVersionUID = 1L;

        private final int offset;
        private final int line;
        private final int column;

        ParseException(String message, int offset, int line, int column) {
            super(message + " at line " + line + ", column " + column);
            this.offset = offset;
            this.line = line;
            this.column = column;
        }

        /** Zero-based character offset into the parsed text. */
        public int getOffset() {
            return offset;
        }

        /** One-based line number. */
        public int getLine() {
            return line;
        }

        /** One-based column number, counted in UTF-16 characters. */
        public int getColumn() {
            return column;
        }
    }
}
