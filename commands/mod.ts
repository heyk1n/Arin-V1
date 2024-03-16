import {
	type APIChatInputApplicationCommandInteraction,
	type APIMessageApplicationCommandInteraction,
	type APIUserApplicationCommandInteraction,
	ApplicationCommandType,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	type RESTPostAPIContextMenuApplicationCommandsJSONBody,
} from "@discordjs/core";

export default {
	chatInputs: [],
	messages: [],
	users: [],
} as Commands;

interface Commands {
	chatInputs: ChatInput[];
	messages: MessageContextMenu[];
	users: UserContextMenu[];
}

export interface ChatInput {
	data: RESTPostAPIChatInputApplicationCommandsJSONBody;
	execute(
		interaction: APIChatInputApplicationCommandInteraction,
	): void | Promise<void>;
}

export interface MessageContextMenu {
	data: ContextMenuCommandData<ApplicationCommandType.Message>;
	execute(
		interaction: APIMessageApplicationCommandInteraction,
	): void | Promise<void>;
}

export interface UserContextMenu {
	data: ContextMenuCommandData<ApplicationCommandType.User>;
	execute(
		interaction: APIUserApplicationCommandInteraction,
	): void | Promise<void>;
}

type ContextMenuCommandData<
	T extends Exclude<ApplicationCommandType, ApplicationCommandType.ChatInput>,
> = Omit<RESTPostAPIContextMenuApplicationCommandsJSONBody, "type"> & {
	type: T;
};
