"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spygame_1 = __importDefault(require("../lib/spygame"));
const DiscordServers_1 = require("../lib/DiscordServers");
const cmdBody = {
    name: "create_spygame",
    description: "create a Spy Game",
    options: [
        {
            name: "max_players",
            description: "set the maximum number of players",
            type: discord_js_1.ApplicationCommandOptionType.Number,
            required: true,
            maxValue: 10,
            minValue: 3
        },
    ]
};
module.exports = {
    data: cmdBody,
    async execute(interaction) {
        const maxPl = interaction.options.getNumber("max_players", true);
        const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
        const isHost = await spygame_1.default.isHost(interaction.guildId, interaction.user.id);
        if (isHost) {
            interaction.reply({
                content: `:x: You have already created a Spygame`,
                ephemeral: true
            });
            return;
        }
        const leaveButton = new discord_js_1.ButtonBuilder()
            .setCustomId(`leave_spygame_${interaction.user.id}`)
            .setLabel("leave")
            .setStyle(4);
        const rowLeave = new discord_js_1.ActionRowBuilder()
            .addComponents(leaveButton);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle("Spy Game")
            .setAuthor({ name: `Waiting for players ${"1 /" + maxPl}` });
        await interaction.reply({
            content: "spygame created :white_check_mark:",
            ephemeral: true,
            components: [rowLeave]
        });
        const button = new discord_js_1.ButtonBuilder()
            .setCustomId(`join_spygame_${interaction.user.id}`)
            .setStyle(3)
            .setLabel("join");
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(button);
        const msg = await interaction.channel.send({
            content: `@everyone new Spygame created by <@${interaction.user.id}>`,
            components: [row],
            embeds: [embed],
        });
        const spygame = new spygame_1.default(interaction.guildId, interaction.user.tag, interaction.user.id, maxPl, interaction.channelId, msg.id);
        await spygame.save();
        setTimeout(async () => {
            const dcServer = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
            dcServer.games.map(async (e, i) => {
                if (e.hostId === interaction.user.id) {
                    if (e.maxPlayers !== e.players.length) {
                        dcServer.games.splice(i, 1);
                        await dcServer.save();
                        await interaction.editReply({
                            content: ":x: Timeout: no one has joined the game",
                            components: [],
                            embeds: []
                        });
                        await interaction.channel.messages.cache.get(msg.id).delete();
                    }
                }
            });
        }, 60 * 5 * 1000);
    }
};
