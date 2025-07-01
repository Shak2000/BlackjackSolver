# Blackjack Solver

A web-based blackjack game with an AI assistant that uses Monte Carlo Tree Search (MCTS) to recommend optimal moves. Play blackjack with the ability to get computer assistance, undo moves, and learn from AI-driven strategy recommendations.

## Features

- **Interactive Blackjack Game**: Full blackjack gameplay with hit, stand, and new game options
- **AI Assistant**: Computer can analyze the current game state and recommend the best move using MCTS
- **Move History**: Track all moves made during the game with visual history display
- **Undo Functionality**: Undo your last move if you change your mind
- **Real-time Game State**: Live updates of card values and game status
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

### Game Rules
- Standard blackjack rules apply
- Player tries to get as close to 21 as possible without going over (busting)
- Face cards (J, Q, K) are worth 10 points
- Aces are worth 11 or 1 (automatically adjusted to prevent busting)
- Dealer must hit on 16 and stand on 17

### AI Decision Making
When you click "Let Computer Decide", the AI:
1. Runs 100 Monte Carlo Tree Search simulations
2. Explores different move sequences and their outcomes
3. Calculates win probabilities for each possible action
4. Recommends the move with the highest expected value
5. Automatically executes the recommended move

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework for the API
- **Python**: Core game logic and MCTS implementation

### Frontend
- **HTML5**: Structure and layout
- **CSS3**: Styling with gradients, animations, and responsive design
- **Vanilla JavaScript**: Game interaction and API communication

### AI Algorithm
- **Monte Carlo Tree Search (MCTS)**: Advanced game tree search algorithm
- **UCB1**: Upper Confidence Bound formula for balancing exploration vs exploitation

## File Structure

```
blackjack-solver/
├── main.py          # Core game logic and MCTS implementation
├── app.py           # FastAPI web server and API endpoints
├── index.html       # Main HTML interface
├── script.js        # Frontend JavaScript logic
├── styles.css       # CSS styling and animations
└── README.md        # This file
```

## Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Installation Steps

1. **Clone or download the project files**
   ```bash
   git clone <repository-url>
   cd blackjack-solver
   ```

2. **Install required Python packages**
   ```bash
   pip install fastapi uvicorn
   ```

3. **Run the application**
   ```bash
   uvicorn app:app --reload
   ```

4. **Open your web browser**
   - Navigate to `http://localhost:8000`
   - The game interface will load automatically

## How to Play

1. **Start a New Game**: Click the "New Game" button to deal initial cards

2. **Make Your Move**:
   - **Hit**: Take another card
   - **Stand**: Keep your current hand and end your turn
   - **Let Computer Decide**: Get AI recommendation and auto-execute
   - **Undo Move**: Reverse your last action (if possible)

3. **Game Flow**:
   - Dealer's second card is hidden until the game ends
   - If you bust (go over 21), you lose immediately
   - If you stand, the dealer plays according to standard rules
   - Winner is determined by who has the higher value without busting

4. **AI Assistance**:
   - Use "Let Computer Decide" when you're unsure of the best move
   - The computer analyzes the situation and makes the optimal play
   - Great for learning blackjack strategy

## API Endpoints

The backend provides RESTful API endpoints:

- `GET /` - Serve the main HTML page
- `POST /new_game` - Start a new game
- `GET /game_state` - Get current game state
- `POST /player_hit` - Player takes a card
- `POST /player_stand` - Player stands
- `POST /dealer_play` - Dealer plays their hand
- `GET /game_result` - Get game outcome
- `POST /undo_move` - Undo last move
- `GET /mcts_simulate` - Run AI simulation and get recommendation

## Understanding the AI

The Monte Carlo Tree Search algorithm works by:

1. **Selection**: Navigate down the game tree using the UCB1 formula
2. **Expansion**: Add new possible moves to explore
3. **Simulation**: Play out random games from the current position
4. **Backpropagation**: Update win/loss statistics for all visited nodes

The AI considers factors like:
- Current hand value
- Dealer's visible card
- Probability of busting with another card
- Expected outcomes of different move sequences

## Customization

### Adjusting AI Difficulty
In `main.py`, you can modify:
- `simulations=100` in the API call to change thinking time
- `exploration_constant=1.4` in UCB1 calculation for risk tolerance

### Styling Changes
Edit `styles.css` to customize:
- Colors and gradients
- Card appearance
- Button styles
- Responsive breakpoints

## Contributing

Feel free to enhance the game by:
- Adding betting functionality
- Implementing card counting hints
- Adding sound effects
- Creating different difficulty levels
- Improving the AI algorithm

## License

This project is open source and available under the MIT License.

## Troubleshooting

**Game not loading?**
- Ensure Python and FastAPI are properly installed
- Check that port 8000 is not in use by another application
- Verify all files are in the same directory

**AI recommendations seem slow?**
- The default 100 simulations provide good accuracy but may take a moment
- Reduce the simulation count in `app.py` for faster responses

**Cards not displaying correctly?**
- Make sure your browser supports modern CSS features
- Try refreshing the page or clearing browser cache
