import { type Static, Type } from "@sinclair/typebox";

export const ChangePasswordSchema = Type.Object({
    currentPassword: Type.String(),
    newPassword: Type.String(),
});

export type ChangePasswordBody = Static<typeof ChangePasswordSchema>;
