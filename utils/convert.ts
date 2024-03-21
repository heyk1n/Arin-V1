import type { Snowflake } from "@discordjs/core";

export function snowflakeToDate(id: Snowflake): Date {
	return new Date(Number(BigInt(id) >> 22n) + 1420070400000);
}
