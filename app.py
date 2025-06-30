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
    return {"status": "success"}


@app.get("/game_state")
async def get_game_state():
    return {
        "player": game.player,
        "dealer": game.dealer,
        "move_history": game.move_history,
        "player_value": game.value(game.player),
        "dealer_value": game.value(game.dealer),
        "game_over": len(game.move_history) > 0 and game.move_history[-1] == 'stand'
    }


@app.post("/take")
async def take():
    # This endpoint seems unused in the current game logic
    result = game.take(game.player)
    return {"success": result}


@app.get("/value")
async def get_player_value():
    return {"value": game.value(game.player)}


@app.post("/dealer_play")
async def dealer_play():
    game.dealer_play()
    return {"status": "success"}


@app.get("/game_result")
async def game_result():
    return {"result": game.game_result()}


@app.post("/player_hit")
async def player_hit():
    success = game.player_hit()
    return {"success": success}


@app.post("/player_stand")
async def player_stand():
    success = game.player_stand()
    return {"success": success}


@app.post("/undo_move")
async def undo_move():
    success = game.undo_move()
    return {"success": success}


@app.get("/mcts_simulate")
async def mcts_simulate():
    action, children = game.mcts_simulate(100)
    return {
        "action": action,
        "children": [{"action": c.action, "visits": c.visits, "wins": c.wins} for c in children]
    }
