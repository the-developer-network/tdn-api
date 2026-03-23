import { BadRequestError } from "@core/errors";
import type { IFollowRepository } from "@core/ports/repositories/follow.repository";
import type { INotificationRepository } from "@core/ports/repositories/notification.repository";
import { Notification } from "@core/domain/entities/notification.entity";
import { NotificationType } from "@core/domain/enums/notification-type.enum";
import type { RealtimePort } from "@core/ports/services/realtime.port";

export class FollowUserUseCase {
    constructor(
        private readonly followUserRepository: IFollowRepository,
        private readonly notificationRepository: INotificationRepository,
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

        const notification = Notification.create(
            targetId,
            currentUserId,
            NotificationType.FOLLOW,
        );

        await this.notificationRepository.create(notification);

        this.realtimeService.emitToUser(targetId, "new-notification", {
            type: NotificationType.FOLLOW,
            issuerId: currentUserId,
        });
    }
}
