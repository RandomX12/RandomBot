import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { getServerByGuildId } from "../lib/DiscordServers";

export default async function execute(interaction : ChatInputCommandInteraction<CacheType>){
    const server = await getServerByGuildId(interaction.guildId)
}