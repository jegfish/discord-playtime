const Discord = require("discord.js");

const config = require("./config.json");

const commands = {
    "ping": {
        invoke: (bot, message) => {
            message.channel.send(`Pong! ${bot.ping}ms`);
        }
    },

    "help": {
        invoke: (bot, message) => {
            const embed = new Discord.RichEmbed()
                .setColor(0x7289DA)
                .addField("help", "Shows this message.");

            message.channel.send({embed});
        }
    }
};

class Bot extends Discord.Client {
    constructor() {
        super();

        this.on("message", (message) => {
            this.process_commands(message);
        });
    }

    get mention() {
        return `<@${this.user.id}>`;
    }

    get prefix() {
        return this.mention;
    }

    process_commands(message) {
        // Only respond to explicitly invoked commands
        if (!message.content.startsWith(this.prefix)) { return }

        const args = message.content.slice(this.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (commands[command]) {
            commands[command].invoke(this, message, ...args);
        } else if (command === "") {
            // If the message was just the mention
            commands["help"].invoke(this, message, ...args);
        }
    }
}

const bot = new Bot();

bot.on("ready", () => {
    console.log("Logged in:");
    console.log("-".repeat(15));
    console.log(`Username: ${bot.user.username}#${bot.user.discriminator}`);
    console.log(`ID: ${bot.user.id}`);
});

bot.on("guildMemberUpdate", (before, after) => {

});

bot.login(config.token);