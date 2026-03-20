import { BadRequestError } from "@core/errors";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import {
    NotificationType,
    type NotificationRepository,
} from "@core/ports/repositories/notification.repository";
import type { RealtimePort } from "@core/ports/services/realtime.port";

export class FollowUserUseCase {
    constructor(
        private readonly followUserRepository: IFollowRepository,
        private readonly notificationRepository: NotificationRepository,
        private readonly realtimeService: RealtimePort,
    ) {}

    async execute(currentUserId: string, targetId: string): Promise<void> {
        if (currentUserId === targetId)
            throw new BadRequestError("You cannot follow yourself.");

        const isFollowing = await this.followUserRepository.checkIsFollowing(
            currentUserId,
            targetId,
        );

        if (isFollowing) return;

        await this.followUserRepository.followUser(currentUserId, targetId);

        await this.notificationRepository.create({
            recipientId: targetId,
            issuerId: currentUserId,
            type: NotificationType.FOLLOW,
        });

        this.realtimeService.emitToUser(targetId, "new-notification", {
            type: NotificationType.FOLLOW,
            issuerId: currentUserId,
        });
    }
}
