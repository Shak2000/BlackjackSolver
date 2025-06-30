// Game state
let gameState = {
    player: [],
    dealer: [],
    moveHistory: [],
    gameOver: false, // This will now primarily be set by the backend state for consistency
    gameStarted: false
};

// DOM elements
const elements = {
    playerHand: document.getElementById('player-hand'),
    dealerHand: document.getElementById('dealer-hand'),
    playerValue: document.getElementById('player-value'),
    dealerValue: document.getElementById('dealer-value'),
    hitBtn: document.getElementById('hit-btn'),
    standBtn: document.getElementById('stand-btn'),
    computerBtn: document.getElementById('computer-btn'),
    undoBtn: document.getElementById('undo-btn'),
    newGameBtn: document.getElementById('new-game-btn'),
    mctsResults: document.getElementById('mcts-results'),
    mctsRecommendation: document.getElementById('mcts-recommendation'),
    mctsChildren: document.getElementById('mcts-children'), // This element will be cleared
    mctsDetailsContainer: document.querySelector('.mcts-details'), // NEW: Reference to the parent of mcts-children
    gameStatus: document.getElementById('game-status'),
    moveHistory: document.getElementById('move-history')
};

// Card display utilities
function getCardDisplay(card) {
    if (!card) return '?';

    const rank = card[0];
    const suit = card[1];

    let displayRank = rank;
    if (rank === 'T') displayRank = '10';

    const suitSymbols = {
        'c': '♣',
        'd': '♦',
        'h': '♥',
        's': '♠'
    };

    return displayRank + suitSymbols[suit];
}

function getCardColor(card) {
    if (!card) return '';
    const suit = card[1];
    return (suit === 'd' || suit === 'h') ? 'red' : 'black';
}

// Calculate hand value
function calculateHandValue(hand) {
    let value = 0;
    let aces = 0;

    for (const card of hand) {
        if (!card) continue;

        const rank = card[0];
        if ('23456789'.includes(rank)) {
            value += parseInt(rank);
        } else if (rank === 'T') {
            value += 10;
        } else if ('JQK'.includes(rank)) {
            value += 10;
        } else if (rank === 'A') {
            value += 11;
            aces++;
        }
    }

    // Adjust for aces
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }

    return value;
}

// Update display
function updateDisplay() {
    // Update player hand
    elements.playerHand.innerHTML = '';
    if (gameState.player.length === 0) {
        elements.playerHand.innerHTML = '<div class="card">Click "New Game" to start</div>';
        elements.playerValue.textContent = 'Value: -';
    } else {
        gameState.player.forEach(card => {
            const cardDiv = document.createElement('div');
            cardDiv.className = `card ${getCardColor(card)}`;
            cardDiv.textContent = getCardDisplay(card);
            elements.playerHand.appendChild(cardDiv);
        });
        elements.playerValue.textContent = `Value: ${calculateHandValue(gameState.player)}`;
    }

    // Update dealer hand
    elements.dealerHand.innerHTML = '';
    if (gameState.dealer.length === 0) {
        elements.dealerHand.innerHTML = '<div class="card">Click "New Game" to start</div>';
        elements.dealerValue.textContent = 'Value: -';
    } else {
        gameState.dealer.forEach((card, index) => {
            const cardDiv = document.createElement('div');
            // Reveal all dealer cards if game is over (based on backend game_over state)
            // Or if it's the first card (index 0)
            if (index === 1 && !gameState.gameOver) { // If it's the second card and game is NOT over
                cardDiv.className = 'card hidden';
                cardDiv.textContent = '?';
            } else {
                cardDiv.className = `card ${getCardColor(card)}`;
                cardDiv.textContent = getCardDisplay(card);
            }
            elements.dealerHand.appendChild(cardDiv);
        });

        if (gameState.gameOver) { // If game is over, show dealer's full value
            elements.dealerValue.textContent = `Value: ${calculateHandValue(gameState.dealer)}`;
        } else {
            // Show only first card value if game is not over
            const visibleValue = gameState.dealer.length > 0 ? calculateHandValue([gameState.dealer[0]]) : 0;
            elements.dealerValue.textContent = `Value: ${visibleValue}`;
        }
    }

    // Update move history
    elements.moveHistory.innerHTML = '';
    gameState.moveHistory.forEach(move => {
        const moveDiv = document.createElement('div');
        moveDiv.className = 'move';
        moveDiv.textContent = move.charAt(0).toUpperCase() + move.slice(1);
        elements.moveHistory.appendChild(moveDiv);
    });

    // Update button states
    const playerValue = calculateHandValue(gameState.player);
    const canPlay = !gameState.gameOver && playerValue <= 21 && gameState.player.length > 0;

    elements.hitBtn.disabled = !canPlay;
    elements.standBtn.disabled = !canPlay;
    elements.computerBtn.disabled = !canPlay;
    elements.undoBtn.disabled = gameState.moveHistory.length === 0 || gameState.gameOver;
}

// API calls
async function makeApiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);

        if (response.ok) {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return true;
        } else {
            throw new Error(`API call failed: ${response.status}`);
        }
    } catch (error) {
        console.error('API Error:', error);
        updateStatus('Error communicating with server', 'lose');
        throw error;
    }
}

// Game actions
async function newGame() {
    try {
        await makeApiCall('/new_game', 'POST');
        // Reset local state for a clean start
        gameState.player = [];
        gameState.dealer = [];
        gameState.moveHistory = [];
        gameState.gameOver = false;
        gameState.gameStarted = true;

        await getGameState(); // Fetch fresh state from backend
        updateStatus('New game started! Make your move.');
        elements.mctsResults.style.display = 'none'; // Hide MCTS section
        elements.mctsDetailsContainer.style.display = 'none'; // NEW: Hide the simulation details section
        updateDisplay();
    } catch (error) {
        console.error('Error starting new game:', error);
    }
}

async function playerHit() {
    try {
        await makeApiCall('/player_hit', 'POST');
        await getGameState(); // Get updated hand and game_over status from backend

        const playerValue = calculateHandValue(gameState.player);
        if (gameState.gameOver) { // Check if game is over based on new state from backend
            await dealerPlay(); // Ensure dealer's final hand is fetched
            await checkGameResult();
        } else {
            updateStatus('Card taken. Make your next move.');
        }
        updateDisplay();
    } catch (error) {
        console.error('Error hitting:', error);
    }
}

async function playerStand() {
    try {
        await makeApiCall('/player_stand', 'POST');
        // After standing, the game is definitely over from the player's perspective.
        gameState.gameOver = true; // Set local state immediately
        await dealerPlay(); // Make dealer play out their hand
        await getGameState(); // Fetch final state, including final dealer hand and confirmed game_over
        await checkGameResult();
        updateDisplay();
    } catch (error) {
        console.error('Error standing:', error);
    }
}

async function dealerPlay() {
    try {
        await makeApiCall('/dealer_play', 'POST');
        await getGameState(); // Get updated state with dealer's full hand
    } catch (error) {
        console.error('Error with dealer play:', error);
    }
}

async function checkGameResult() {
    try {
        const result = await makeApiCall('/game_result');
        if (result && typeof result.result !== 'undefined') {
            const gameResult = result.result;

            if (gameResult === 1) {
                updateStatus('You win! 🎉', 'win');
            } else if (gameResult === -1) {
                updateStatus('Dealer wins! 😞', 'lose');
            } else {
                updateStatus('It\'s a tie! 🤝', 'tie');
            }
        }
    } catch (error) {
        console.error('Error getting game result:', error);
    }
}

async function undoMove() {
    try {
        await makeApiCall('/undo_move', 'POST');
        await getGameState(); // Get the state after undo
        updateStatus('Move undone.');
        elements.mctsResults.style.display = 'none'; // Hide MCTS section on undo
        elements.mctsDetailsContainer.style.display = 'none'; // NEW: Hide simulation details on undo
        updateDisplay();
    } catch (error) {
        console.error('Error undoing move:', error);
    }
}

async function letComputerDecide() {
    try {
        updateStatus('Computer is thinking... 🤔');
        elements.computerBtn.disabled = true;

        const result = await makeApiCall('/mcts_simulate'); // Backend will only return action
        if (result && result.action) {
            const { action } = result; // Only receive action, 'children' will be empty

            // Display MCTS recommendation, ensuring details are hidden
            displayMCTSRecommendation(action);

            // Execute the recommended action
            if (action === 'hit') {
                await playerHit();
            } else {
                await playerStand();
            }
        }
    } catch (error) {
        console.error('Error with computer decision:', error);
        updateStatus('Error getting computer recommendation');
    } finally {
        elements.computerBtn.disabled = false;
    }
}

// Get current game state from the backend
async function getGameState() {
    try {
        const result = await await makeApiCall('/game_state');
        if (result) {
            gameState.player = result.player || [];
            gameState.dealer = result.dealer || [];
            gameState.moveHistory = result.move_history || [];
            gameState.gameOver = result.game_over || false; // Crucial: Get game_over from backend
        }
    } catch (error) {
        console.error('Error getting game state:', error);
    }
}

// Modified to only show recommendation, and explicitly hide simulation results
function displayMCTSRecommendation(recommendedAction) {
    elements.mctsRecommendation.innerHTML = `
        <strong>Computer recommends: ${recommendedAction.toUpperCase()}</strong>
    `;
    elements.mctsChildren.innerHTML = ''; // Ensure children display area is empty
    elements.mctsDetailsContainer.style.display = 'none'; // NEW: Hide the entire 'Simulation Results:' section
    elements.mctsResults.style.display = 'block'; // Show the overall MCTS section
}

function updateStatus(message, type = '') {
    elements.gameStatus.innerHTML = `<p>${message}</p>`;
    elements.gameStatus.className = `status ${type}`;
}

// Event listeners
elements.hitBtn.addEventListener('click', playerHit);
elements.standBtn.addEventListener('click', playerStand);
elements.computerBtn.addEventListener('click', letComputerDecide);
elements.undoBtn.addEventListener('click', undoMove);
elements.newGameBtn.addEventListener('click', newGame);

// Initialize game
async function initializeGame() {
    updateStatus('Click "New Game" to start playing!');
    updateDisplay();
    // Ensure the MCTS results and simulation details are hidden on initial load
    elements.mctsResults.style.display = 'none';
    elements.mctsDetailsContainer.style.display = 'none'; // NEW: Hide simulation details on load
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', initializeGame);
