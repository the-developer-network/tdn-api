import type { IProfileRepository } from "@core/ports/repositories/profile.repository";
import type { UpdateProfileInput } from "./update-profile-usecase.input";

export class UpdateProfileUseCase {
    constructor(private readonly profileRepository: IProfileRepository) {}

    async execute(input: UpdateProfileInput): Promise<void> {
        await this.profileRepository.update(input.userId, input);
    }
}
