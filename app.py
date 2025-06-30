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
    # Determine if the game is over.
    # It's over if player busted, or player stood, or dealer played out.
    is_game_over = False
    player_busted = game.value(game.player) > 21
    player_stood = len(game.move_history) > 0 and game.move_history[-1] == 'stand'

    # If the game result is already decided (e.g., player bust or blackjack, or after dealer plays)
    # The `game_result()` method in `main.py` implicitly triggers dealer_play for evaluation,
    # but the actual `game.dealer` state might not reflect it unless `dealer_play()` is called.
    # For a robust `game_over` check, we need to know if the game logic has concluded.
    # The simplest is to check if player_busted or if the last action was stand, and if so,
    # the game is essentially "over" for display purposes.
    if player_busted or player_stood:
        is_game_over = True
    elif game.game_result() != None and game.move_history and game.move_history[-1] == 'dealer_finished':
        # This is a placeholder; you might need to adjust `main.py`
        # to explicitly mark when the dealer has finished their turn
        # if you want a server-side state for dealer finishing without player standing.
        # For now, we rely on client-side to call dealer_play() and then check results.
        pass

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
    # Calling dealer_play here modifies the game.dealer state
    game.dealer_play()
    # After dealer plays, the game is over for sure.
    # We should update the `game_over` state in the `Game` class if you want a persistent server-side state for it.
    # For now, let's ensure the client always gets the updated dealer hand when this is called.
    return {"status": "success"}


@app.get("/game_result")
async def game_result():
    # This will implicitly cause dealer to play if needed for result calculation in main.py Game.game_result()
    # but doesn't persist the dealer's final hand in the `game` object unless `dealer_play()` was called.
    return {"result": game.game_result()}


@app.post("/player_hit")
async def player_hit():
    success = game.player_hit()
    # If player busts, the game is over.
    if game.value(game.player) > 21:
        # In main.py, you don't explicitly set a game.game_over flag.
        # This will be handled by the frontend's playerHit logic setting gameState.gameOver
        # and then calling dealerPlay.
        pass
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
        # Only pass the action, not the children details, to the UI
        # This will prevent the UI from displaying them, even if it tries.
        "children": []  # Send an empty list for children
    }
