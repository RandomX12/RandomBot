import { CacheType, Interaction } from "discord.js";
import DiscordServers, { fetchServer } from "../DiscordServers";
import DiscordServersError from "./DiscordServers";
import Config from "../DiscordServersConfig";
import Command, { ButtonCommand } from "../Commands";

/**
 * try to solve the error.
 * @note Not all the errors are solvable
 * Throws an error if it fails to solve the error
 */
export default async function troubleshoot(
  error: unknown,
  interaction: Interaction<CacheType>,
  command: Command | ButtonCommand
) {
  if (error instanceof DiscordServersError) {
    if (error.code === "404") {
      const server = new DiscordServers({
        serverId: interaction.guildId,
      });
      await server.save();
      return;
    } else if (error.code === "402") {
      const config = new Config(interaction.guildId);
      await config.save(interaction.guildId);
      return;
    } else if (error.code === "401") {
      if (!interaction.isChatInputCommand()) return;
      if (!command) return;
      const server = await fetchServer(interaction.guildId);
      server.config?.commands?.push({
        enable: true,
        name: interaction.commandName,
        permissions: command.permissions,
        rolesId: [],
      });
      await server.update();
      return;
    }
  }
  throw error;
}
