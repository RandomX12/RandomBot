"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const DiscordServers_1 = __importDefault(require("./DiscordServers"));
const DiscordServersConfig_1 = __importDefault(require("./DiscordServersConfig"));
const discordServers_1 = __importDefault(require("../model/discordServers"));
async function verify(interaction) {
    let server = await discordServers_1.default.findOne({ serverId: interaction.guildId });
    if (!server) {
        const members = interaction.guild.members.cache.map((e) => {
            return {
                username: e.user.tag,
                id: e.user.id
            };
        });
        server = new DiscordServers_1.default({
            name: interaction.guild.name,
            members: members,
            serverId: interaction.guildId,
            games: []
        });
        await server.save();
        interaction.reply({
            content: "This server is not saved in the database. try again",
            ephemeral: true
        });
        return false;
    }
    if (!server.config) {
        server.config = new DiscordServersConfig_1.default().config;
        await server.save();
    }
    for (let i = 0; i < server.config?.commands?.length; i++) {
        if (server.config.commands[i].name === interaction.commandName) {
            if (!server.config.commands[i].enable) {
                await interaction.reply({
                    content: ":x: This command is disabled in this server",
                    ephemeral: true
                });
                return false;
            }
            if (server.config.commands[i].bannedUsers.indexOf(interaction.user.id) > -1) {
                await interaction.reply({
                    content: "You are banned from using this command :x:",
                    ephemeral: true
                });
                return false;
            }
            if (server.config.commands[i].permissions.length === 0) {
                server.config.commands[i].permissions = null;
            }
            if (server.config.commands[i].rolesId.length === 0) {
                server.config.commands[i].rolesId = null;
            }
            if (!server.config.commands[i].permissions && !server.config.commands[i].rolesId) {
                return true;
            }
            const member = interaction.member;
            if (server.config.commands[i].permissions) {
                for (let j = 0; j < server.config.commands[i].permissions.length; j++) {
                    if (member.permissions.has(server.config.commands[i].permissions[j])) {
                        return true;
                    }
                }
            }
            if (server.config.commands[i].rolesId) {
                for (let j = 0; j < server.config.commands[i].rolesId.length; j++) {
                    if (member.roles.cache.has(server.config.commands[i].rolesId[j])) {
                        return true;
                    }
                }
            }
            await interaction.reply({
                content: "You don't have the permission to this command :x:",
                ephemeral: true
            });
            return false;
        }
    }
    return true;
}
exports.verify = verify;
