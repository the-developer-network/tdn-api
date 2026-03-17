import { type Static, Type } from "@sinclair/typebox";

export const ChangeEmailSchema = Type.Object({
    newEmail: Type.String({ format: "email" }),
});

export type ChangeEmailBody = Static<typeof ChangeEmailSchema>;
