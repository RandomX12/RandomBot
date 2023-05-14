"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verify = void 0;
const DiscordServers_1 = require("./DiscordServers");
async function verify(interaction) {
    const server = await (0, DiscordServers_1.getServerByGuildId)(interaction.guildId);
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
            if (server.config.commands[i].permissions.length === 0 || server.config.commands[i].rolesId.length === 0 || !server.config.commands[i].permissions || server.config.commands[i].rolesId) {
                return true;
            }
            const member = interaction.member;
            for (let j = 0; j < server.config.commands[i].permissions.length; j++) {
                if (member.permissions.has(server.config.commands[i].permissions[j])) {
                    return true;
                }
            }
            for (let j = 0; j < server.config.commands[i].rolesId.length; j++) {
                if (member.roles.cache.has(server.config.commands[i].rolesId[j])) {
                    return true;
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
