import type UserService from "@services/user.service";
import type AuthService from "@services/auth.service";

declare module "@fastify/awilix" {
    interface Cradle {
        userService: UserService;
        authService: AuthService;
    }
}

export {};
