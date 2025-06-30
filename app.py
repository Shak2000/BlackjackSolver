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
    player_busted = game.value(game.player) > 21
    # Check if the game is over. It's over if player busted, or player stood.
    is_game_over = player_busted or (len(game.move_history) > 0 and game.move_history[-1] == 'stand')

    return {
        "player": game.player,
        "dealer": game.dealer,
        "move_history": game.move_history,
        "player_value": game.value(game.player),
        "dealer_value": game.value(game.dealer),
        "game_over": is_game_over  # Updated logic for game_over
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
    # Only allow dealer to play if the game is NOT already over by player bust/blackjack/stand
    player_value = game.value(game.player)
    player_busted = player_value > 21
    player_blackjack = player_value == 21
    player_stood = len(game.move_history) > 0 and game.move_history[-1] == 'stand'

    # Dealer should only play if player hasn't busted/got blackjack AND player has stood.
    # If the player busts, the dealer doesn't need to play.
    # If the player gets blackjack, the dealer still needs to play to check for a push.
    if not player_busted and player_stood:
        game.dealer_play()
    elif player_blackjack and not player_stood:  # If player has 21 but hasn't stood, they might hit again.
        # This case implies player might have hit to 21, and then computer decided.
        # The game_result call later will handle the dealer's action if necessary for a 21.
        pass  # Dealer doesn't explicitly 'play' here through this endpoint, game_result handles it.

    return {"status": "success"}


@app.get("/game_result")
async def game_result():
    # This will implicitly cause dealer to play if needed for result calculation in main.py Game.game_result()
    # However, the dealer's *actual hand* in `game.dealer` on the server needs to be updated by `dealer_play()`.
    # The `main.py` game_result already calls `temp_game.dealer_play()`, which is good for the result,
    # but the `game.dealer` state itself might not be updated unless `dealer_play()` is explicitly called on `game`.
    # Since `dealer_play` endpoint is called before `game_result` in `script.js` for "stand",
    # and the new `player_hit` logic will skip `dealer_play` for busts, this should be fine.
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
    action, children = game.mcts_simulate(100)  #
    return {
        "action": action,
        "children": []  # Always return empty children to prevent display
    }
