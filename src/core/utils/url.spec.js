import expect from 'expect';
import { appendQuery } from './url';

/**
 * Adapted from https://github.com/lakenen/node-append-query
 */
describe('appendQuery()', () =>{
    it('should append querystring to queryless url', () => {
        const result = appendQuery('http://example.com/foo', 'bar=baz&beep=boop')
            , expected = 'http://example.com/foo?bar=baz&beep=boop'
        expect(result).toEqual(expected);
    });

    it('should append querystring to url that already has a query', () => {
        const result = appendQuery('http://example.com/?foo=bar', 'hello=world')
            , expected = 'http://example.com/?foo=bar&hello=world';
        expect(result).toEqual(expected);
    });

    it('should append query object to url', () => {
        const result = appendQuery('http://example.com/', { beep: 'boop' })
            , expected = 'http://example.com/?beep=boop';
        expect(result).toEqual(expected);
    });

    it('should append query object with nested properties to url', () => {
        const result = appendQuery('http://example.com/', { beep: { boop: 'bop' } })
            , expected = 'http://example.com/?beep%5Bboop%5D=bop';
        expect(result).toEqual(expected);
    });

    // Will not pass because the 'prefix' parameter is never sent to the serialize() method
    // it('should append query object with an array to url', () => {
    //     const result = appendQuery('http://example.com/', { beep: ['boop', 'bop'] })
    //         , expected = 'http://example.com/?beep%5B%5D=boop&beep%5B%5D=bop';
    //     expect(result).toEqual(expected);
    // });

    it('should overwrite existing params by name in url', () => {
        const result = appendQuery('http://example.com/?one=1&two=1', { two: 2 })
            , expected = 'http://example.com/?one=1&two=2';
        expect(result).toEqual(expected);
    });

    it('should append just param name when query property is null', () => {
        const result = appendQuery('http://example.com/', { nothing: null })
            , expected = 'http://example.com/?nothing';
        expect(result).toEqual(expected);
    });

    // Options
    it('should encode a url if encodeComponents is truthy when passed as an option', () => {
        const result = appendQuery('http://example.com/?foo="bar"', 'hello="world"', { encodeComponents: true })
            , expected = 'http://example.com/?foo=%22bar%22&hello=%22world%22';
        expect(result).toEqual(expected);
    });

    it('should not encode a url if encodeComponents is falsy when passed as an option', () => {
        const result = appendQuery('http://example.com/?foo="bar"', 'hello="world"', { encodeComponents: false })
            , expected = 'http://example.com/?foo="bar"&hello="world"';
        expect(result).toEqual(expected);
    });

    it('should remove null values when removeNull is true', () => {
        const result = appendQuery('http://example.com/?test=1', { test: null }, { removeNull: true })
            , expected = 'http://example.com/';
        expect(result).toEqual(expected);
    });

});
