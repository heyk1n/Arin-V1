import { decodeHex } from "$std/encoding/hex.ts";
import type { APIInteraction } from "discord";
import tweetnacl from "npm:tweetnacl@1.0.3";

export async function validateRequest(
	request: Request,
): Promise<ValidationResult> {
	const requiredHeaders = ["x-signature-ed25519", "x-signature-timestamp"];

	if (request.method !== "POST") {
		return { valid: false, error: "Method not allowed" };
	} else if (
		!requiredHeaders.every((header) => request.headers.has(header))
	) {
		return { valid: false, error: "Missing headers" };
	} else if (!Deno.env.has("DISCORD_PUBLIC_KEY")) {
		return { valid: false, error: "Missing public key" };
	} else {
		return await verifySignature(request);
	}
}

async function verifySignature(request: Request): Promise<ValidationResult> {
	const body = await request.text();
	const signature = request.headers.get("x-signature-ed25519")!;
	const timestamp = request.headers.get("x-signature-timestamp")!;
	const publicKey = Deno.env.get("DISCORD_PUBLIC_KEY")!;

	const valid = tweetnacl.sign.detached.verify(
		new TextEncoder().encode(timestamp + body),
		decodeHex(signature),
		decodeHex(publicKey),
	);

	if (!valid) {
		return { valid, error: "Invalid signature" };
	} else {
		const interaction: APIInteraction = JSON.parse(body);
		return { valid, interaction };
	}
}

type ValidationResult = { valid: true; interaction: APIInteraction } | {
	valid: false;
	error: string;
};
