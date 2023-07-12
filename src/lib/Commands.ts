import { ApplicationCommandDataResolvable, ButtonInteraction, CacheType, ChatInputCommandInteraction, GuildMember, InteractionEditReplyOptions, InteractionReplyOptions, MessagePayload, PermissionResolvable } from "discord.js";
import DiscordServers from "./DiscordServers";
import Config from "./DiscordServersConfig";
import discordServers, { Member } from "../model/discordServers";
import { Bot } from "./Bot";
/**
 * Reply to a message dynamically
 * If the interaction is replied or deferred it will edit the message
 * If not it will reply to the interaction 
 * @param interaction discord interaction
 * @param options message options and data
 */
export async function reply(interaction : ChatInputCommandInteraction | ButtonInteraction<CacheType>,options : string | MessagePayload | InteractionEditReplyOptions | InteractionReplyOptions){
    if(interaction.deferred || interaction.replied){
        await interaction.editReply(options)
    }else{
        await interaction.reply(options)
    }
}

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
       await reply(interaction,{
            content : "This server is not saved in our database. try again",
            ephemeral : true
       })
       return false
    }
    if(!server.config){
        server.config = new Config().config
        await server.save()
    }
    let command = Bot.client.commands.get(interaction.commandName)
    for(let permissions of command.access){
        if(!interaction.guild.members.me.permissions.has(permissions)){
            const msg = `🟡 warning : ${interaction.client.user.username} needs "**${command.access?.join(" , ") || ""}**" permission${command.access.length > 1 ? "s" : ""} to execute this command '**/${interaction.commandName}**'.
    please can any one give me ${command.access.length > 1 ? "these" : "this"} permission${command.access.length > 1 ? "s" : ""}`
            await interaction.channel.send({
                content : msg
            })
            return false
        }
    }
    for(let i = 0;i<server.config?.commands?.length;i++){
        if(server.config.commands[i].name === interaction.commandName){
            if(!server.config.commands[i].enable){
                await reply(interaction,{
                    content : ":x: This command is disabled in this server",
                    ephemeral : true
                })
                return false
            }
            if(server.config.commands[i].bannedUsers.indexOf(interaction.user.id) > -1){
                await reply(interaction,{
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

            await reply(interaction,{
                content : "You don't have the permission to this command :x:",
                ephemeral : true
            })
            return false
        }
    }
    return true
}

export interface CommandOptions{
    data : ApplicationCommandDataResolvable,
    execute : (interaction : ChatInputCommandInteraction<CacheType>)=> Promise<void>
    permissions? : PermissionResolvable[],
    ephemeral? : boolean,
    deferReply? : boolean,
    access? : PermissionResolvable[],
}


/**
 * New way to create a slash command
 * @note still beta
 */
export default class Command implements CommandOptions{
    public data: ApplicationCommandDataResolvable;
    public execute: (interaction: ChatInputCommandInteraction<CacheType>) => Promise<void>;
    public permissions?: PermissionResolvable[];
    public ephemeral?: boolean;
    public deferReply?: boolean;
    public access?: PermissionResolvable[];
    constructor(command : CommandOptions){
        this.data = command.data
        this.execute = command.execute
        this.permissions = command.permissions
        this.ephemeral = command.ephemeral
        this.deferReply = (command.deferReply === undefined ? true : command.deferReply)
        this.access = (command.access ? command.access : [])
    }
    async save(){
        await Bot.client.application.commands.create(this.data)
        //@ts-ignore
        Bot.client.commands.set(this.data.name,this)
        //@ts-ignore
        Bot.cmds.set(this.data.name,new Map<string,Member>())
    }
}
