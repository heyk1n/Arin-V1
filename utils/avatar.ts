import type { APIGuildMember, APIUser, Snowflake } from "@discordjs/core";
import type { CDN, ImageURLOptions } from "@discordjs/rest";

export function getAvatar(
	cdn: CDN,
	entity: APIGuildMember,
	options?: ImageURLOptions & { guildId: Snowflake },
): string;
export function getAvatar(
	cdn: CDN,
	entity: APIUser,
	options?: ImageURLOptions,
): string;
export function getAvatar(
	cdn: CDN,
	entity: APIGuildMember | APIUser,
	options?: ImageURLOptions & { guildId?: Snowflake },
): string {
	if (isGuildMemberEntity(entity) && options?.guildId) {
		return getMemberAvatar(cdn, options.guildId, entity) ??
			getUserAvatar(cdn, entity.user!) ??
			getDefaultAvatar(cdn, entity.user!);
	} else if (isUserEntity(entity)) {
		return getUserAvatar(cdn, entity) ?? getDefaultAvatar(cdn, entity);
	} else {
		throw new Error("Invalid entity.");
	}
}

export function getMemberAvatar(
	cdn: CDN,
	guildId: Snowflake,
	member: APIGuildMember,
): string | null {
	if (member.avatar) {
		return cdn.guildMemberAvatar(guildId, member.user!.id, member.avatar);
	} else {
		return null;
	}
}

export function getUserAvatar(cdn: CDN, user: APIUser): string | null {
	if (user.avatar) {
		return cdn.avatar(user.id, user.avatar);
	} else {
		return null;
	}
}

export function getDefaultAvatar(cdn: CDN, user: APIUser): string {
	return cdn.defaultAvatar(Number(BigInt(user.id) >> 22n % 6n));
}

function isGuildMemberEntity(
	entity: APIGuildMember | APIUser,
): entity is APIGuildMember {
	return "user" in entity;
}

function isUserEntity(entity: APIGuildMember | APIUser): entity is APIUser {
	return !isGuildMemberEntity(entity);
}
