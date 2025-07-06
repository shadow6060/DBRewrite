/* eslint-disable quotes */
/* eslint-disable indent */
import got from "got";
import { EmbedBuilder } from "discord.js";
import { Command } from "../../structures/Command";

interface MemeResponse {
  url: string;
  postLink: string;
  title: string;
  ups: number;
  subreddit: string;
}

export const command = new Command("memes", "memes!")
  .setCategory("🎉fun")
  .setExecutor(async int => {
    try {
      const response = await got('https://meme-api.com/gimme').json<MemeResponse>();

      const memeImage = response.url;
      const memeTitle = response.title;
      const memeUrl = response.postLink;
      const memeUpvotes = response.ups;
      const subreddit = response.subreddit;

      await int.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(memeTitle)
            .setURL(memeUrl)
            .setImage(memeImage)
            .setDescription(`${int.user.tag} found this in r/${subreddit}`)
            .setFooter({ text: `👍 ${memeUpvotes} upvotes` }),
        ],
      });
    } catch (err) {
      console.error("Failed to fetch meme:", err);
      await int.reply("😢 Sorry, couldn't grab a meme right now.");
    }
  });
