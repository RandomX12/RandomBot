import {SlashCommandBuilder,ChatInputCommandInteraction,CacheType,EmbedBuilder} from "discord.js"

module.exports = {
    data : new SlashCommandBuilder()
            .setName("ping")
            .setDescription("test the bot"),
    async execute(interaction : ChatInputCommandInteraction<CacheType>){
        const date = Date.now()
        await interaction.reply({
            content : "...",
            ephemeral : true
        })
        const embed = new EmbedBuilder()
        .setColor(0x6dfd7d)
        const after = Date.now()
        embed.setTitle("pong :white_check_mark:  \n " + `**${after-date}ms**`)
        await interaction.editReply({
            embeds : [embed],
            content : ""
        })
    }
}