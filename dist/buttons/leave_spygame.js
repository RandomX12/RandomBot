"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spygame_1 = __importDefault(require("../lib/spygame"));
const DiscordServers_1 = __importDefault(require("../lib/DiscordServers"));
module.exports = {
    data: {
        name: "leave_spygame_[:id]",
        descreption: "Leave a Spy game"
    },
    async execute(interaction) {
        await spygame_1.default.leave(interaction.guildId, interaction.customId.split("_")[2], interaction.user.id);
        const isHost = await spygame_1.default.isHost(interaction.guildId, interaction.user.id);
        if (isHost) {
            const game = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
            const announcement = interaction.channel.messages.cache.get(game.announcementId);
            if (announcement) {
                await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.customId.split("_")[2]);
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Spy Game deleted :x:")
                    .setAuthor({ name: "The host left the game" });
                await announcement.edit({
                    content: '',
                    components: [],
                    embeds: [embed]
                });
                await interaction.reply({
                    content: "You left the game",
                    ephemeral: true
                });
            }
        }
        else {
            const game = await DiscordServers_1.default.getGameByHostId(interaction.guildId, interaction.customId.split("_")[2]);
            const announcement = interaction.channel.messages.cache.get(game.announcementId);
            if (announcement) {
                if (game.started || game.players.length === game.maxPlayers) {
                    const embed = new discord_js_1.EmbedBuilder()
                        .setTitle("Spy Game deleted :x:")
                        .setAuthor({ name: `${interaction.user.username} left the game` });
                    await DiscordServers_1.default.deleteGame(interaction.guildId, interaction.customId.split("_")[2]);
                    await announcement.edit({
                        embeds: [embed],
                        content: "",
                        components: []
                    });
                    return;
                }
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle("Spy Game")
                    .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
                    .setAuthor({ name: `Waiting for players ${game.players.length} / ${game.maxPlayers}` });
                const button = new discord_js_1.ButtonBuilder()
                    .setCustomId(`join_spygame_${interaction.user.id}`)
                    .setStyle(3)
                    .setLabel("join");
                const row = new discord_js_1.ActionRowBuilder()
                    .addComponents(button);
                await announcement.edit({
                    embeds: [embed],
                    components: [row]
                });
                await interaction.reply({
                    content: "You left the game",
                    ephemeral: true
                });
            }
            else {
                await DiscordServers_1.default.deleteGame(interaction.guildId, game.hostId);
                const errorEmbed = new discord_js_1.EmbedBuilder()
                    .setAuthor({ name: "Spy Game" })
                    .setTitle("Looks like someone deleted the game announcement ❌")
                    .setFooter({ text: "Game deleted" });
                await interaction.channel.send({
                    embeds: [errorEmbed],
                });
            }
        }
    }
};
