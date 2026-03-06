import type { UserPayload } from "@core/interfaces/user-payload.interface";
import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: UserPayload;
        user: UserPayload;
    }
}
