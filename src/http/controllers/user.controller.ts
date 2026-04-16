import type { GetUserPostsUseCase } from "@core/use-cases/post/get-user-posts/get-user.posts.usecase";
import type { ChangeEmailUseCase } from "@core/use-cases/user/change-email";
import type { ChangePasswordUseCase } from "@core/use-cases/user/change-password";
import type { ChangeUsernameUseCase } from "@core/use-cases/user/change-username";
import type { GetMeUserUseCase } from "@core/use-cases/user/get-me";
import type { SoftDeleteUserUseCase } from "@core/use-cases/user/soft-delete";
import { PostPrismaMapper } from "@infrastructure/persistence/mappers/post-prisma.mapper";
import type {
    GetUserPostsParams,
    GetUserPostsQuery,
} from "@typings/schemas/post/get-user-posts.schema";
import type { ChangeEmailBody } from "@typings/schemas/user/change-email.schema";
import type { ChangePasswordBody } from "@typings/schemas/user/change-password.schema";
import type { ChangeUsernameBody } from "@typings/schemas/user/change-username.schema";
import type { SoftDeleteUserBody } from "@typings/schemas/user/soft-delete.schema";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * UserController handles user-related HTTP requests such as account management and fetching user-specific data. It uses various use cases to perform operations like soft deleting a user, changing email, password, username, and fetching the authenticated user's profile information. The controller methods extract necessary data from the request object, call the appropriate use case, and send structured responses back to the client.
 */
export class UserController {
    /**
     * UserController constructor to inject use cases for user-related operations.
     * @param softDeleteUserUseCase - Use case for soft deleting a user account.
     * @param getMeUserUseCase - Use case for fetching the authenticated user's profile information.
     * @param changePasswordUseCase - Use case for changing the authenticated user's password.
     * @param changeUsernameUseCase - Use case for changing the authenticated user's username.
     * @param changeEmailUseCase - Use case for changing the authenticated user's email.
     * @param getUserPostsUseCase - Use case for fetching posts of a specific user with pagination and optional filtering by post type.
     * The constructor initializes the UserController with the necessary use cases to handle various user-related operations such as account management and fetching user-specific data.
     */
    constructor(
        private readonly softDeleteUserUseCase: SoftDeleteUserUseCase,
        private readonly getMeUserUseCase: GetMeUserUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly changeUsernameUseCase: ChangeUsernameUseCase,
        private readonly changeEmailUseCase: ChangeEmailUseCase,
        private readonly getUserPostsUseCase: GetUserPostsUseCase,
    ) {}

    /**
     * Controller method to handle soft deletion of the authenticated user's account. It retrieves the user ID from the authenticated request object and the password from the request body. The method then calls the SoftDeleteUserUseCase to perform the soft deletion operation. Finally, it sends a 204 No Content response to indicate that the operation was successful without returning any content in the response body.
     * @route DELETE /users/me
     * @param request - The Fastify request object containing the authenticated user information and the password in the body.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     * @throws Will throw an error if the password is incorrect or if the soft deletion operation fails.
     */
    async softDeleteMe(
        request: FastifyRequest<{ Body: SoftDeleteUserBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const id = request.user.id;
        const { password } = request.body;

        await this.softDeleteUserUseCase.execute({
            id,
            password,
        });

        reply.status(204).send();
    }

    /**
     * Controller method to handle fetching the authenticated user's profile information. It retrieves the user ID from the authenticated request object and calls the GetMeUserUseCase to fetch the user's profile data. Finally, it sends a structured response containing the user's profile information along with metadata such as a timestamp.
     * @route GET /users/me
     * @param request - The Fastify request object containing the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const result = await this.getMeUserUseCase.execute({
            id: request.user.id,
        });

        reply.status(200).send({
            data: result,
            meta: { timestamp: new Date().toISOString() },
        });
    }

    /**
     * Controller method to handle changing the password of the authenticated user. It extracts the current and new passwords from the request body and the user ID from the authenticated request object. The method then calls the ChangePasswordUseCase to perform the password update operation. Finally, it sends a 204 No Content response to indicate that the operation was successful without returning any content in the response body.
     * @route PATCH /users/me/password
     * @param request - The Fastify request object containing the current and new passwords in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @return A promise that resolves when the response is sent.
     */
    async changePasswordMe(
        request: FastifyRequest<{ Body: ChangePasswordBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { currentPassword, newPassword } = request.body;

        await this.changePasswordUseCase.execute({
            id: request.user.id,
            currentPassword,
            newPassword,
        });

        reply.status(204).send();
    }

    /**
     * Controller method to handle changing the username of the authenticated user. It extracts the new username from the request body and the user ID from the authenticated request object. The method then calls the ChangeUsernameUseCase to perform the username update operation. Finally, it sends a 204 No Content response to indicate that the operation was successful without returning any content in the response body.
     * @route PATCH /users/me/username
     * @param request - The Fastify request object containing the new username in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    async changeUsernameMe(
        request: FastifyRequest<{ Body: ChangeUsernameBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;

        await this.changeUsernameUseCase.execute({
            id: userId,
            newUsername: request.body.newUsername,
        });

        return reply.status(204).send();
    }

    /**
     * Controller method to handle changing the email of the authenticated user. It extracts the new email from the request body and the user ID from the authenticated request object. The method then calls the ChangeEmailUseCase to perform the email update operation. Finally, it sends a 204 No Content response to indicate that the operation was successful without returning any content in the response body.
     * @route PATCH /users/me/email
     * @param request - The Fastify request object containing the new email in the body and the authenticated user information.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    async changeEmailMe(
        request: FastifyRequest<{ Body: ChangeEmailBody }>,
        reply: FastifyReply,
    ): Promise<void> {
        const userId = request.user.id;

        await this.changeEmailUseCase.execute({
            id: userId,
            newEmail: request.body.newEmail,
        });

        return reply.status(204).send();
    }

    /**
     * Controller method to handle fetching posts of a specific user with pagination and optional filtering by post type.
     * It retrieves the username from the route parameters and pagination details from the query string.
     * The method then calls the GetUserPostsUseCase to fetch the relevant posts and formats the response using PostPrismaMapper.
     * Finally, it sends a structured response containing the posts data along with pagination metadata.
     * @route GET /users/:username/posts
     * @param request - The Fastify request object containing route parameters and query string.
     * @param reply - The Fastify reply object used to send the response.
     * @returns A promise that resolves when the response is sent.
     */
    async getUserPosts(
        request: FastifyRequest<{
            Params: GetUserPostsParams;
            Querystring: GetUserPostsQuery;
        }>,
        reply: FastifyReply,
    ): Promise<void> {
        const { username } = request.params;
        const { page = 1, limit = 10, type } = request.query;

        const cdnUrl = request.server.config.R2_PUBLIC_URL;
        const currentUserId = request.user?.id;
        const result = await this.getUserPostsUseCase.execute({
            username,
            page,
            limit,
            type,
            currentUserId,
        });

        const formattedData = PostPrismaMapper.toFeedResponse(
            result.posts,
            cdnUrl,
        );

        const totalPages = Math.ceil(result.total / limit);

        return reply.status(200).send({
            data: formattedData,
            meta: {
                total: result.total,
                currentPage: page,
                limit,
                totalPages,
                timestamp: new Date().toISOString(),
            },
        });
    }
}
