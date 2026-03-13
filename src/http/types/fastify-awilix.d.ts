import type AuthController from "@services/auth.controller";
import type UserController from "@services/user.controller";

declare module "@fastify/awilix" {
    interface Cradle {
        userController: UserController;
        authController: AuthController;
    }
}

export {};
