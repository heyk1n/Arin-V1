import {
	type APIApplicationCommandInteraction,
	type APIInteraction,
	type APIMessageApplicationCommandInteraction,
	type APIPingInteraction,
	ApplicationCommandType,
	InteractionType,
} from "@discordjs/core";

export function isCommand(
	interaction: APIInteraction,
): interaction is APIApplicationCommandInteraction {
	return interaction.type === InteractionType.ApplicationCommand;
}

export function isPing(
	interaction: APIInteraction,
): interaction is APIPingInteraction {
	return interaction.type === InteractionType.Ping;
}

export function isMessageContextMenuCommand(
	command: APIApplicationCommandInteraction,
): command is APIMessageApplicationCommandInteraction {
	return command.data.type === ApplicationCommandType.Message;
}
