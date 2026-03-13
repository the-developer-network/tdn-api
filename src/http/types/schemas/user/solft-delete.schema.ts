import { type Static, Type } from "@sinclair/typebox";

export const SoftDeleteUserSchema = Type.Object({
    password: Type.String(),
});

export type SoftDeleteUserBody = Static<typeof SoftDeleteUserSchema>;
