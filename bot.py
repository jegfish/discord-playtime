import discord
from discord.ext import commands

import config

description = """
I am a bot written by Altarrel to keep track of your Discord presence.
"""

class TrackerBot(commands.Bot):
    def __init__(self):
        super().init(command_prefix=commands.when_mentioned(), 
                     description=description)

    async def on_ready(self):
        print("LOGGED IN"
              "-" * 10
              f"Username: {self.user}"
              f"ID: {self.user.id}"
              f"discord.py version: {discord.__version__}")

bot = TrackerBot()
bot.run(config.token)