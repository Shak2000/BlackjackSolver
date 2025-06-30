from fastapi import FastAPI
from fastapi.responses import FileResponse

from main import Game

game = Game()
app = FastAPI()


@app.get("/")
async def get_ui():
    return FileResponse("index.html")


@app.get("/styles.css")
async def get_styles():
    return FileResponse("styles.css")


@app.get("/script.js")
async def get_script():
    return FileResponse("script.js")


@app.post("/new_game")
async def new_game():
    game.new_game()


@app.post("/take")
async def take(hand):
    game.take(hand)


@app.get("/value")
async def value(hand):
    game.take(hand)


@app.post("/dealer_play")
async def dealer_play():
    game.dealer_play()


@app.get("/game_result")
async def game_result():
    game.game_result()


@app.post("/player_hit")
async def player_hit():
    game.player_hit()


@app.post("/player_stand")
async def player_stand():
    game.player_stand()


@app.post("/undo_move")
async def undo_move():
    game.undo_move()


@app.get("/mcts_simulate")
async def mcts_simulate():
    game.mcts_simulate()
