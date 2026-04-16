import { Type } from "@fastify/type-provider-typebox";
import { ResponseSchema } from "../create-response-schema";

/**
 * Defines the response schema for the "Get Me" endpoint, which returns the authenticated user's profile information. The schema includes fields such as username, email, email verification status, account creation and update timestamps, and a list of authentication providers associated with the user's account. This schema is used to validate and structure the response sent back to the client when they request their profile information.
 * @returns A TypeBox schema object representing the structure of the response for the "Get Me" endpoint.
 */
export const GetMeResponseSchema = ResponseSchema(
    Type.Object({
        username: Type.String(),
        email: Type.String({ format: "email" }),
        isEmailVerified: Type.Boolean(),
        createdAt: Type.String(),
        updatedAt: Type.String(),
        providers: Type.Array(Type.String()),
    }),
);
