import { describe, expect, it } from 'vitest';

import { JSONRPC_VERSION } from '../../src/types/constants';
import {
    isCallToolResult,
    isJSONRPCErrorResponse,
    isJSONRPCResponse,
    isJSONRPCResultResponse,
    parseJSONRPCMessage
} from '../../src/types/guards';

describe('parseJSONRPCMessage', () => {
    it('lifts response-level server/discover fields before strict envelope validation', () => {
        expect(
            parseJSONRPCMessage({
                jsonrpc: '2.0',
                id: 'probe-1',
                result: { supportedVersions: ['2026-07-28'] },
                resultType: 'complete',
                _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'server', version: '1.0.0' } }
            })
        ).toEqual({
            jsonrpc: '2.0',
            id: 'probe-1',
            result: {
                supportedVersions: ['2026-07-28'],
                resultType: 'complete',
                _meta: { 'io.modelcontextprotocol/serverInfo': { name: 'server', version: '1.0.0' } }
            }
        });
    });

    it('continues rejecting unrelated response-level fields', () => {
        expect(() => parseJSONRPCMessage({ jsonrpc: '2.0', id: 1, result: {}, extraTop: true })).toThrow();
    });

    it('continues rejecting an array result instead of treating it as an envelope', () => {
        expect(() =>
            parseJSONRPCMessage({
                jsonrpc: '2.0',
                id: 1,
                result: [],
                resultType: 'complete'
            })
        ).toThrow();
    });
});

describe('isJSONRPCResponse', () => {
    it('returns true for a valid result response', () => {
        expect(
            isJSONRPCResponse({
                jsonrpc: JSONRPC_VERSION,
                id: 1,
                result: {}
            })
        ).toBe(true);
    });

    it('returns true for a valid error response', () => {
        expect(
            isJSONRPCResponse({
                jsonrpc: JSONRPC_VERSION,
                id: 1,
                error: { code: -32_600, message: 'Invalid Request' }
            })
        ).toBe(true);
    });

    it('returns false for a request', () => {
        expect(
            isJSONRPCResponse({
                jsonrpc: JSONRPC_VERSION,
                id: 1,
                method: 'test'
            })
        ).toBe(false);
    });

    it('returns false for a notification', () => {
        expect(
            isJSONRPCResponse({
                jsonrpc: JSONRPC_VERSION,
                method: 'test'
            })
        ).toBe(false);
    });

    it('returns false for arbitrary objects', () => {
        expect(isJSONRPCResponse({ foo: 'bar' })).toBe(false);
    });

    it('narrows the type correctly', () => {
        const value: unknown = {
            jsonrpc: JSONRPC_VERSION,
            id: 1,
            result: { content: [] }
        };
        if (isJSONRPCResponse(value)) {
            // Type should be narrowed to JSONRPCResponse
            expect(value.jsonrpc).toBe(JSONRPC_VERSION);
            expect(value.id).toBe(1);
        }
    });

    it('agrees with isJSONRPCResultResponse || isJSONRPCErrorResponse', () => {
        const values = [
            { jsonrpc: JSONRPC_VERSION, id: 1, result: {} },
            { jsonrpc: JSONRPC_VERSION, id: 2, error: { code: -1, message: 'err' } },
            { jsonrpc: JSONRPC_VERSION, id: 3, method: 'test' },
            { jsonrpc: JSONRPC_VERSION, method: 'notify' },
            { foo: 'bar' },
            null,
            42
        ];
        for (const v of values) {
            expect(isJSONRPCResponse(v)).toBe(isJSONRPCResultResponse(v) || isJSONRPCErrorResponse(v));
        }
    });
});

describe('isCallToolResult', () => {
    it('returns false for an empty object (content is required)', () => {
        expect(isCallToolResult({})).toBe(false);
    });

    it('returns false for an explicit content: undefined (the schema default parses it, but the narrowed type requires the array)', () => {
        expect(isCallToolResult({ content: undefined, structuredContent: { ok: true } })).toBe(false);
    });

    it('returns true for a result with content', () => {
        expect(
            isCallToolResult({
                content: [{ type: 'text', text: 'hello' }]
            })
        ).toBe(true);
    });

    it('returns true for a result with isError', () => {
        expect(
            isCallToolResult({
                content: [{ type: 'text', text: 'fail' }],
                isError: true
            })
        ).toBe(true);
    });

    it('returns true for a result with structuredContent', () => {
        expect(
            isCallToolResult({
                content: [],
                structuredContent: { key: 'value' }
            })
        ).toBe(true);
    });

    it('returns false for non-objects', () => {
        expect(isCallToolResult(null)).toBe(false);
        expect(isCallToolResult(42)).toBe(false);
        expect(isCallToolResult('string')).toBe(false);
    });

    it('returns false for invalid content items', () => {
        expect(
            isCallToolResult({
                content: [{ type: 'invalid' }]
            })
        ).toBe(false);
    });
});
