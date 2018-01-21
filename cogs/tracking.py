import time

import discord
from discord.ext import commands

# Basic setup of the tracked dict:

# {
#     userID: {
#         unique_game_name: time_played
#     }
# }

def setup(bot):
    bot.add_cog(Tracking(bot))

class Tracking:
    """Track user's presence changes
    """

    def __init__(self, bot):
        self.bot = bot

    async def on_member_update(self, before, after):
        if after.bot:
            return

        current_time = time.time()
        if after.id not in self.bot.tracked:
            self.bot.tracked[after.id] = {
                "start_time": current_time,
                "recent_time": current_time
            }
            return

        if before.game == after.game:
            return

    @commands.command()
    async def test(self, ctx):
        await ctx.send(ctx.author.game.name)