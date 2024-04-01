import got from "got";
import { MessageEmbed } from "discord.js";
import { text } from "../../providers/config";
import { mainChannels } from "../../providers/discord";
import { Command } from "../../structures/Command";
import { format } from "../../utils/string";
export const command = new Command("memes", "memes!")
  .setExecutor(async int => {
    got('https://www.reddit.com/r/memes/random/.json')
      .then((response: { body: string; }) => {
        const [list] = JSON.parse(response.body);
        const [post] = list.data.children;

        const permalink = post.data.permalink;
        const memeUrl = `https://reddit.com${permalink}`;
        const memeImage = post.data.url;
        const memeTitle = post.data.title;
        const memeUpvotes = post.data.ups;
        const memeNumComments = post.data.num_comments;
        int.reply({
          embeds: [
            new MessageEmbed()
              .setImage(memeImage)
              .setDescription(`${int.user.tag} Has summoned a meme!`)
              .setFooter({ text: memeUrl, memeUpvotes, }),

          ],
        });
      });
  }); 