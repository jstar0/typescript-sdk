import { parseJSONRPCMessage } from '../types/guards';
import type { JSONRPCMessage } from '../types/index';

export const STDIO_DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;

/**
 * Buffers a continuous stdio stream into discrete JSON-RPC messages.
 */
export class ReadBuffer {
    private _buffer?: Buffer;
    private _maxBufferSize: number;
    private _messageParser: (value: unknown) => JSONRPCMessage;

    constructor(options?: { maxBufferSize?: number; messageParser?: (value: unknown) => JSONRPCMessage }) {
        this._maxBufferSize = options?.maxBufferSize ?? STDIO_DEFAULT_MAX_BUFFER_SIZE;
        this._messageParser = options?.messageParser ?? parseJSONRPCMessage;
    }

    append(chunk: Buffer): void {
        const newSize = (this._buffer?.length ?? 0) + chunk.length;
        if (newSize > this._maxBufferSize) {
            this.clear();
            throw new Error(`ReadBuffer exceeded maximum size of ${this._maxBufferSize} bytes`);
        }
        this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
    }

    readMessage(): JSONRPCMessage | null {
        while (this._buffer) {
            const index = this._buffer.indexOf('\n');
            if (index === -1) {
                return null;
            }

            const line = this._buffer.toString('utf8', 0, index).replace(/\r$/, '');
            this._buffer = this._buffer.subarray(index + 1);

            try {
                return deserializeMessage(line, this._messageParser);
            } catch (error) {
                // Skip non-JSON lines (e.g., debug output from hot-reload tools like
                // tsx or nodemon that write to stdout). Schema validation errors still
                // throw so malformed-but-valid-JSON messages surface via onerror.
                if (error instanceof SyntaxError) {
                    continue;
                }
                throw error;
            }
        }
        return null;
    }

    clear(): void {
        this._buffer = undefined;
    }
}

export function deserializeMessage(line: string, messageParser: (value: unknown) => JSONRPCMessage = parseJSONRPCMessage): JSONRPCMessage {
    return messageParser(JSON.parse(line));
}

export function serializeMessage(message: JSONRPCMessage): string {
    return JSON.stringify(message) + '\n';
}
