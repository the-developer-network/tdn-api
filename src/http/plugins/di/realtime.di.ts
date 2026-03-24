import { asClass } from "awilix";
import { RedisService } from "@infrastructure/realtime/redis/redis.service";
import { WebSocketManager } from "@infrastructure/realtime/websocket/websocket-manager";
import { FastifyRealtimeService } from "@infrastructure/realtime/fastify-realtime.service";

export const realtimeModule = {
    // --- Services ---
    redisService: asClass(RedisService).singleton(),
    wsManager: asClass(WebSocketManager).singleton(),
    realtimeService: asClass(FastifyRealtimeService).singleton(),
};
