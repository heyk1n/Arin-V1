import { STATUS_CODE } from "$std/http/status.ts";
import {
	API,
	type APIInteractionResponseChannelMessageWithSource,
	type APIInteractionResponsePong,
	InteractionResponseType,
	MessageFlags,
} from "@discordjs/core";
import { REST } from "@discordjs/rest";

import manifest from "./manifest.gen.ts";
import {
	isCommand,
	isMessageContextMenuCommand,
	isPing,
	validateRequest,
} from "./utils/mod.ts";

import type { Command } from "./types.d.ts";

const token = Deno.env.get("DISCORD_TOKEN");
if (!token) {
	throw new Error('Env "DISCORD_TOKEN" not found.');
}

const kv = await Deno.openKv();
const api = new API(new REST().setToken(token));

async function handler(request: Request): Promise<Response> {
	const validation = await validateRequest(request);
	if (!validation.valid) {
		return new Response(validation.error, {
			status: STATUS_CODE.Unauthorized,
		});
	} else {
		const { interaction } = validation;

		if (isCommand(interaction)) {
			const commandNotFound:
				APIInteractionResponseChannelMessageWithSource = {
					type: InteractionResponseType.ChannelMessageWithSource,
					data: {
						content: `Eh.. kayaknya salah command deh..`,
						flags: MessageFlags.Ephemeral,
					},
				};
			const filter = (ctx: Command) =>
				interaction.data.name === ctx.data.name;

			if (isMessageContextMenuCommand(interaction)) {
				const command = manifest.commands.messages.find(filter);
				if (!command) return Response.json(commandNotFound);

				return await command.execute({ api, interaction, kv });
			} else {
				return Response.json(commandNotFound);
			}
		} else if (isPing(interaction)) {
			const filter = (ctx: Command) => ctx.data;
			const { id } = await api.applications.getCurrent();

			await api.applicationCommands.bulkOverwriteGlobalCommands(id, [
				...manifest.commands.messages.map(filter),
			]);

			const response: APIInteractionResponsePong = {
				type: InteractionResponseType.Pong,
			};
			return Response.json(response);
		} else {
			throw new Error(`Unknown interaction type: ${interaction.type}`);
		}
	}
}

Deno.serve(handler);
