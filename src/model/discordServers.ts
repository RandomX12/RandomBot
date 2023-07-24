import { model, Schema } from "mongoose";
import { ConfigT } from "../lib/DiscordServersConfig";
export interface Member {
  username: string; // with tag
  id: string;
}
export interface Game {
  hostId: string;
  hostName: string;
  players?: Member[];
  channelId: string;
}
export interface DiscordServer {
  serverId: string;
  name: string;
  members: Member[];
  games: Game[];
  config?: ConfigT<boolean>;
}

const discordServer = new Schema<DiscordServer>({
  name: {
    required: true,
    type: String,
  },
  serverId: {
    required: true,
    type: String,
  },
  members: {
    required: true,
    type: [Object],
  },
  config: {
    required: true,
    type: {
      commands: {
        required: true,
        type: [
          {
            name: String,
            enable: Boolean,
            //@ts-ignore
            permissions: [String],
            rolesId: [String],
            bannedUsers: [String],
          },
        ],
      },
      quiz: {
        type: {
          multiple_channels: Boolean,
          customGames: {
            required: false,
            type: Boolean,
            default: false,
          },
          channels_category: {
            required: false,
            type: String,
          },
          private: {
            required: false,
            default: false,
            type: Boolean,
          },
          category_name: {
            type: String,
            require: false,
          },
          roles: {
            required: false,
            type: [
              {
                id: {
                  type: String,
                  required: true,
                },
                gamesPerUser: {
                  type: Number,
                  required: false,
                },
                playQzgame: {
                  type: Boolean,
                  required: false,
                },
              },
            ],
            default: [],
          },
          gameStart: {
            required: true,
            type: Number,
            default: 0,
          },
          viewChannel: {
            required: true,
            type: [String],
            default: [],
          },
        },
        required: true,
        default: {
          multiple_channels: false,
          private: false,
        },
      },
    },
  },
});

export default model<DiscordServer>("Discord servers", discordServer);
