import { model, Schema } from "mongoose";
import { ConfigT } from "../lib/DiscordServersConfig";
export interface Member {
  username: string; // with tag
  id: string;
}
export interface Game {
  hostId: string;
  hostName: string;
  channelId: string;
}
export interface DiscordServer {
  serverId: string;
  config?: ConfigT;
}

const discordServer = new Schema<DiscordServer>({
  serverId: {
    required: true,
    type: String,
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
          multiple_channels: {
            required: true,
            default: {
              enable: false,
              private: {
                enable: false,
                viewChannel: [],
              },
            },
            type: {
              enable: Boolean,
              category_id: String,
              category_name: String,
              private: {
                enable: Boolean,
                viewChannel: [String],
              },
            },
          },
          customGames: {
            required: false,
            type: Boolean,
            default: true,
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
            default: 1,
          },
        },
        required: true,
      },
    },
  },
});

export default model<DiscordServer>("Discord servers", discordServer);
