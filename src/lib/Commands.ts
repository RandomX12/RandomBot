import { CacheType, ChatInputCommandInteraction, GuildMember } from "discord.js";
import DiscordServers, { getServerByGuildId } from "./DiscordServers";
import Config from "./DiscordServersConfig";
import discordServers, { Member } from "../model/discordServers";

export async function verify(interaction : ChatInputCommandInteraction<CacheType>) : Promise<boolean>{
    let server : any = await discordServers.findOne({serverId : interaction.guildId})
    if(!server){
        const members : Member[] = interaction.guild.members.cache.map((e)=>{
            return {
                username : e.user.tag,
                id : e.user.id
            }
        })
        server = new DiscordServers({
            name : interaction.guild.name,
            members : members,
            serverId : interaction.guildId,
            games : []
       })
       await server.save()
       interaction.reply({
        content : "This server is not saved in the database. try again",
        ephemeral : true
       })
       return false
    }
    if(!server.config){
        server.config = new Config().config
        await server.save()
    }
    for(let i = 0;i<server.config?.commands?.length;i++){
        if(server.config.commands[i].name === interaction.commandName){
            if(!server.config.commands[i].enable){
                await interaction.reply({
                    content : ":x: This command is disabled in this server",
                    ephemeral : true
                })
                return false
            }
            if(server.config.commands[i].bannedUsers.indexOf(interaction.user.id) > -1){
                await interaction.reply({
                    content : "You are banned from using this command :x:",
                    ephemeral : true
                })
                return false
            }
            if(server.config.commands[i].permissions.length === 0){
                server.config.commands[i].permissions = null
            }
            if(server.config.commands[i].rolesId.length === 0){
                server.config.commands[i].rolesId = null
            }
            if(!server.config.commands[i].permissions && !server.config.commands[i].rolesId){
                return true
            }
            const member = interaction.member as GuildMember
            if(server.config.commands[i].permissions){
                for(let j = 0;j<server.config.commands[i].permissions.length;j++){
                    if(member.permissions.has(server.config.commands[i].permissions[j])){
                        return true
                    }
                }
            }
            if(server.config.commands[i].rolesId){
                for(let j=0;j<server.config.commands[i].rolesId.length;j++){
                    if(member.roles.cache.has(server.config.commands[i].rolesId[j])){
                        return true
                    }
                }
            }

            await interaction.reply({
                content : "You don't have the permission to this command :x:",
                ephemeral : true
            })
            return false
        }
    }
    return true
}