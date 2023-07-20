import {
  ApplicationCommandDataResolvable,
  ApplicationCommandOptionType,
  CacheType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  PermissionResolvable,
} from "discord.js";
import { QzGame } from "../lib/QuizGame";
import DiscordServers from "../lib/DiscordServers";
import { warning } from "../lib/cmd";
import Command, { reply } from "../lib/Commands";
import { games } from "..";

const cmdBody: ApplicationCommandDataResolvable = {
  name: "delete_quizgame",
  description: "Delete a Quiz Game",
  options: [
    {
      name: "id",
      description: "Game id",
      type: ApplicationCommandOptionType.String,
      required: false,
    },
  ],
};
const permissions: PermissionResolvable[] = ["Administrator"];
module.exports = new Command({
  data: cmdBody,
  async execute(interaction: ChatInputCommandInteraction<CacheType>) {
    let hostId = interaction.options.getString("id");
    if (!hostId) {
      const game = games.select({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        mainChannel: false,
      })[0];
      if (!game) {
        await reply(interaction, {
          content: `still`,
          ephemeral: true,
        });
        return;
      }
      hostId = game.hostId;
    }
    const game = await QzGame.getGame(hostId);
    const announcement = await QzGame.getAnnouncement(interaction, game.hostId);
    DiscordServers.deleteGame(game.hostId);
    if (announcement) {
      const deleteEmbed = new EmbedBuilder()
        .setTitle(`${interaction.user.tag} deleted the game`)
        .setAuthor({ name: "Quiz Game" })
        .setFooter({ text: "Game Deleted" });
      await announcement.edit({
        content: "",
        components: [],
        embeds: [deleteEmbed],
      });
      await reply(interaction, {
        content: "Game deleted :white_check_mark:",
        ephemeral: true,
      });
      if (!game.mainChannel) {
        await announcement.channel.edit({ name: "Game Deleted 🔴" });
        setTimeout(async () => {
          try {
            await announcement.channel.delete();
          } catch (err: any) {
            warning(err.message);
          }
        }, 1000 * 10);
      }
    }
  },
  permissions: permissions,
  ephemeral: true,
  access: ["ManageChannels"],
});
