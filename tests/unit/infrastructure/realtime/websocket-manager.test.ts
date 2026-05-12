import { describe, expect, it } from "vitest";
import EventEmitter from "node:events";
import { WebSocketManager } from "@infrastructure/realtime/websocket/websocket-manager";
import type { WebSocket } from "@fastify/websocket";

function makeSocket(): WebSocket & { emit: (event: string) => boolean } {
    return new EventEmitter() as unknown as WebSocket & {
        emit: (event: string) => boolean;
    };
}

describe("WebSocketManager", () => {
    describe("addClient / getClient", () => {
        it("should store the socket and return it via getClient", () => {
            const manager = new WebSocketManager();
            const socket = makeSocket();

            manager.addClient("user-1", socket);

            expect(manager.getClient("user-1")).toBe(socket);
        });

        it("should return undefined for an unknown userId", () => {
            const manager = new WebSocketManager();

            expect(manager.getClient("unknown")).toBeUndefined();
        });

        it("should overwrite the previous socket on reconnect", () => {
            const manager = new WebSocketManager();
            const socket1 = makeSocket();
            const socket2 = makeSocket();

            manager.addClient("user-1", socket1);
            manager.addClient("user-1", socket2);

            expect(manager.getClient("user-1")).toBe(socket2);
        });
    });

    describe("removeClient", () => {
        it("should remove the socket so getClient returns undefined", () => {
            const manager = new WebSocketManager();
            const socket = makeSocket();

            manager.addClient("user-1", socket);
            manager.removeClient("user-1");

            expect(manager.getClient("user-1")).toBeUndefined();
        });
    });

    describe("close event handling", () => {
        it("should remove the client when its socket closes (normal flow)", () => {
            const manager = new WebSocketManager();
            const socket = makeSocket();

            manager.addClient("user-1", socket);
            socket.emit("close");

            expect(manager.getClient("user-1")).toBeUndefined();
        });

        it("should NOT remove a newer socket when an old socket closes (reconnect race fix)", () => {
            const manager = new WebSocketManager();
            const socket1 = makeSocket();
            const socket2 = makeSocket();

            manager.addClient("user-1", socket1);
            manager.addClient("user-1", socket2); // reconnect — socket2 replaces socket1

            socket1.emit("close"); // stale close from old connection

            expect(manager.getClient("user-1")).toBe(socket2);
        });
    });
});
