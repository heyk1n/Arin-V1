import { STATUS_CODE } from "$std/http/status.ts";
import { validateRequest } from "./utils/validateRequest.ts";

import { InteractionResponseType, InteractionType } from "discord";

async function handler(request: Request): Promise<Response> {
	const validation = await validateRequest(request);
	if (!validation.valid) {
		return new Response(validation.error, {
			status: STATUS_CODE.Unauthorized,
		});
	} else {
		const { interaction } = validation;
		switch (interaction.type) {
			case InteractionType.Ping: {
				return Response.json({ type: InteractionResponseType.Pong });
			}
			default: {
				throw new Error(
					`Unknown interaction type: ${interaction.type}`,
				);
			}
		}
	}
}

Deno.serve(handler);
