import discord
from discord.ext import commands

# Basic setup of the tracked dict:

# {
#     userID: {
#         current_game: {
#             start_time: time,
#             recent_time: time
#         },
#         games: {
#             unique_game_name: time_played
#         }
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
        print(after.game.name)

    @commands.command()
    async def test(self, ctx):
        await ctx.send(ctx.author.game.name)