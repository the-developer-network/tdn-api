import { type Static, Type } from "@sinclair/typebox";

export const ChangeUsernameSchema = Type.Object({
    newUsername: Type.String(),
});

export type ChangeUsernameBody = Static<typeof ChangeUsernameSchema>;
