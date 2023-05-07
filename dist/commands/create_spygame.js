"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const spygame_1 = __importStar(require("../lib/spygame"));
const DiscordServers_1 = require("../lib/DiscordServers");
const cmd_1 = require("../lib/cmd");
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
            .setAuthor({ name: `Waiting for players ${"1 /" + maxPl}` })
            .setThumbnail("https://media.istockphoto.com/id/846415384/vector/spy-icon.jpg?s=612x612&w=0&k=20&c=VJI5sbn-wprj6ikxVWxIm3p4fHYAwb2IHmr7lJBXa5g=")
            .setTimestamp(Date.now());
        const button = new discord_js_1.ButtonBuilder()
            .setCustomId(`join_spygame_${interaction.user.id}`)
            .setStyle(3)
            .setLabel("join");
        const row = new discord_js_1.ActionRowBuilder()
            .addComponents(button);
        let msg = await interaction.channel.send({
            content: `creating Spy Game...`,
        });
        try {
            const spygame = new spygame_1.default(interaction.guildId, interaction.user.tag, interaction.user.id, maxPl, interaction.channelId, msg.id);
            await spygame.save();
        }
        catch (err) {
            await msg.delete();
            msg = null;
            throw new Error(err.message);
        }
        try {
            await msg.edit({
                content: `@everyone new Spygame created by <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`,
                components: [row],
                embeds: [embed],
            });
            await interaction.reply({
                content: "spygame created :white_check_mark:",
                ephemeral: true,
                components: [rowLeave]
            });
        }
        catch (err) {
            spygame_1.default.delete(interaction.guildId, interaction.user.id);
            throw new Error(err.message);
        }
        setTimeout(async () => {
            try {
                const dcServer = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
                dcServer.games.map(async (e, i) => {
                    if (e.hostId === interaction.user.id && (0, spygame_1.isSpyGame)(e)) {
                        if (e.maxPlayers !== e.players.length) {
                            dcServer.games.splice(i, 1);
                            await dcServer.save();
                            await interaction.editReply({
                                content: ":x: Timeout: no one has joined the game",
                                components: [],
                                embeds: []
                            });
                            await msg.delete();
                        }
                    }
                });
            }
            catch (err) {
                (0, cmd_1.error)(err.message);
            }
        }, 60 * 5 * 1000);
    }
};
