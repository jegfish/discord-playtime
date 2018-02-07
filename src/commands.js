const Discord = require("discord.js");
const config = require("./config.json");

const commands = {
    "ping": async (bot, message) => {
        message.channel.send(`Pong! ${bot.ping}ms`);
    },

    "help": async (bot, message) => {
        const embed = new Discord.RichEmbed()
            .setColor(config.embed_color)
            .setTitle("My Commands")
            .addField("help", "Shows this message.")
            .addField("games [page]", "Shows your game playtimes.")
            .addField("ignore", "Prevents your game playtimes from being tracked. " + 
                                 "I will still listen to your commands, so you " +
                                 "can use this one again to enable playtime tracking.")
            .setFooter(`My prefix is @${bot.user.username}`);

        message.channel.send({embed});
    },

    "games": async (bot, message, page) => {
        author_games = bot.games.get(message.author.id);
        if (!author_games) {
            message.channel.send(`${message.author.username}#${message.author.discriminator} | I don't have any data on your playtimes.`);
            return;
        }

        page = ~~page - 1;
        let pages = await bot.paginate_games_embed(author_games);

        if (pages.length === 0) {
            message.channel.send(`${message.author.username}#${message.author.discriminator} | I don't have any data on your playtimes.`);
        }

        if (page < 0 || page > pages.length - 1) {
            page = 0;
        }

        let embed = pages[page];
        embed.setTitle(`${message.author.username}#${message.author.discriminator} | Your Playtimes`);
        embed.setFooter(`Showing page ${page + 1} of ${pages.length}.`);
        message.channel.send({ embed });
    },

    "ignore": async (bot, message) => {
        let ignored = bot.ignored.get(message.author.id);
        if (!ignored) {
            bot.ignored.set(message.author.id, true);
            bot.games.delete(message.author.id);
            bot.tracked.delete(message.author.id);
            message.channel.send(`${message.author.username}#${message.author.discriminator} | ` +
                                 "I will no longer track your game playtimes.");
        } else {
            bot.ignored.delete(message.author.id);
            message.channel.send(`${message.author.username}#${message.author.discriminator} | ` +
                                 "I will now track your game playtimes.");
        }
    },

    "invite": async (bot, message) => {
        message.channel.send(`<https://discordapp.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=18432&scope=bot>`);
    }
};

module.exports = commands;