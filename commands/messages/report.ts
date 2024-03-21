import type { MessageContextMenu, MessageReport } from "../../types.d.ts";
import {
	type API,
	type APIActionRowComponent,
	type APIButtonComponent,
	type APIInteractionResponseChannelMessageWithSource,
	type APIInteractionResponseDeferredChannelMessageWithSource,
	type APIMessage,
	type APIMessageApplicationCommandInteraction,
	ApplicationCommandType,
	ButtonStyle,
	ComponentType,
	InteractionResponseType,
	MessageFlags,
	MessageType,
	StickerFormatType,
} from "@discordjs/core";
import { getAvatar, snowflakeToDate } from "../../utils/mod.ts";

const command: MessageContextMenu = {
	data: {
		name: "Report",
		type: ApplicationCommandType.Message,
		dm_permission: false,
	},
	execute({ api, interaction, kv }) {
		const supportedMessageTypes = [
			MessageType.ChatInputCommand,
			MessageType.ContextMenuCommand,
			MessageType.Default,
			MessageType.Reply,
		];
		const message = Object.values(interaction.data.resolved.messages).at(
			0,
		)!;

		if (!supportedMessageTypes.includes(message.type)) {
			const response: APIInteractionResponseChannelMessageWithSource = {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					flags: MessageFlags.Ephemeral,
					content: `Tipe pesan yang kmu submit tidak valid.`,
				},
			};
			return Response.json(response);
		} else if (message.author.id === interaction.application_id) {
			const response: APIInteractionResponseChannelMessageWithSource = {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					flags: MessageFlags.Ephemeral,
					content: "Kerja bagus.",
				},
			};
			return Response.json(response);
		} else {
			const response:
				APIInteractionResponseDeferredChannelMessageWithSource = {
					type: InteractionResponseType
						.DeferredChannelMessageWithSource,
					data: {
						flags: MessageFlags.Ephemeral,
					},
				};

			queueMicrotask(() => reportMessage(api, interaction, kv, message));
			return Response.json(response);
		}
	},
};

export default command;

async function reportMessage(
	api: API,
	interaction: APIMessageApplicationCommandInteraction,
	kv: Deno.Kv,
	message: APIMessage,
): Promise<void> {
	const reportChannel = Deno.env.get("DISCORD_REPORT_CHANNEL");
	if (!reportChannel) {
		await api.interactions.editReply(
			interaction.application_id,
			interaction.token,
			{
				content:
					`Wah.. tempat laporannya belum di setup nih, Beritahu staff atau developer supaya tempat untuk melaporkan pengguna atau pesan disediakan, tengkyew >_`,
			},
		);
	} else {
		const reportExpiration = 604_800_000;
		const reportId = [
			"reports",
			"messages",
			interaction.guild_id!,
			message.id,
		];
		const { value: reportData } = await kv.get<MessageReport>(reportId);

		if (reportData) {
			await api.interactions.editReply(
				interaction.application_id,
				interaction.token,
				{ content: `Seseorang sudah melaporkan pesan ini.` },
			);
		} else {
			const atomic = kv.atomic();
			const attachments = [];
			const timestamp = snowflakeToDate(message.id).toISOString();
			const messageUrl =
				`https://discord.com/channels/${interaction.guild_id}/${message.channel_id}/${message.id}`;

			const row: APIActionRowComponent<APIButtonComponent> = {
				components: [{
					type: ComponentType.Button,
					style: ButtonStyle.Link,
					label: "Jump to message",
					url: messageUrl,
				}],
				type: ComponentType.ActionRow,
			};

			for (const attachment of message.attachments) {
				const response = await fetch(attachment.url);
				const buffer = await response.arrayBuffer();
				const data = new Uint8Array(buffer);

				attachments.push({ data, name: attachment.filename });
			}

			try {
				const sticker = message.sticker_items?.at(0);
				if (sticker) {
					const response = await fetch(
						api.rest.cdn.sticker(sticker.id),
					);
					const stickerData = new Uint8Array(
						await response.arrayBuffer(),
					);

					let extension;
					switch (sticker.format_type) {
						case StickerFormatType.APNG:
						case StickerFormatType.PNG: {
							extension = "png";
							break;
						}
						case StickerFormatType.GIF: {
							extension = "png";
							break;
						}
						case StickerFormatType.Lottie: {
							extension = "json";
							break;
						}
					}

					const filename = `${sticker.id}.${extension}`;

					const reportMessage = await api.channels.createMessage(
						reportChannel,
						{
							allowed_mentions: {
								parse: [],
							},
							files: [{ data: stickerData, name: filename }],
							content: `<@${
								interaction.member!.user.id
							}> melaporkan pesan stiker yang dikirim oleh <@${message.author.id}> di <#${interaction.channel.id}>`,
							embeds: [{
								color: 0xffffff,
								author: {
									name: message.author.username,
									icon_url: getAvatar(
										api.rest.cdn,
										message.author,
									),
								},
								image: {
									url: `attachment://${filename}`,
								},
								timestamp,
							}],
							components: [row],
						},
					);

					const newReportData: MessageReport = {
						authorId: interaction.member!.user.id,
						reportMessageId: reportMessage.id,
					};
					atomic.set(reportId, newReportData, {
						expireIn: reportExpiration,
					});
				} else if (
					message.flags &&
					((message.flags & MessageFlags.IsVoiceMessage) ==
						MessageFlags.IsVoiceMessage)
				) {
					const reportMessage = await api.channels.createMessage(
						reportChannel,
						{
							allowed_mentions: {
								parse: [],
							},
							files: attachments,
							content: `<@${
								interaction.member!.user.id
							}> melaporkan pesan voice note yang dikirim oleh <@${message.author.id}> di <#${interaction.channel.id}>`,
							embeds: [{
								color: 0xffffff,
								author: {
									name: message.author.username,
									icon_url: getAvatar(
										api.rest.cdn,
										message.author,
									),
								},
								timestamp,
							}],
							components: [row],
						},
					);

					const newReportData: MessageReport = {
						authorId: interaction.member!.user.id,
						reportMessageId: reportMessage.id,
					};
					atomic.set(reportId, newReportData, {
						expireIn: reportExpiration,
					});
				} else {
					const reportMessage = await api.channels.createMessage(
						reportChannel,
						{
							allowed_mentions: {
								parse: [],
							},
							files: attachments,
							content: `<@${
								interaction.member!.user.id
							}> baru saja melaporkan pesan yang dikirim oleh <@${message.author.id}> di <#${interaction.channel.id}>`,
							embeds: [{
								color: 0xffffff,
								author: {
									name: message.author.username,
									icon_url: getAvatar(
										api.rest.cdn,
										message.author,
									),
								},
								description: message.content.length >= 1
									? message.content
									: `_Pesan ini tidak memiliki teks._`,
								timestamp,
							}],
							components: [row],
						},
					);

					const newReportData: MessageReport = {
						authorId: interaction.member!.user.id,
						reportMessageId: reportMessage.id,
					};
					atomic.set(reportId, newReportData, {
						expireIn: reportExpiration,
					});
				}

				await atomic.commit();
				await api.interactions.editReply(
					interaction.application_id,
					interaction.token,
					{
						content:
							`Laporan kamu telah dikirim ke tim moderator untuk ditindaklanjuti, (laporan ini akan tersedia sampai 7 hari ke depan)`,
					},
				);
			} catch (_) {
				await api.interactions.editReply(
					interaction.application_id,
					interaction.token,
					{
						content:
							`Uhm.. bentar, kayaknya ada yg salah deh, coba tanyain developer soal hal ini ya.`,
					},
				);
			}
		}
	}
}
