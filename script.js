// Game state
let gameState = {
    player: [],
    dealer: [],
    moveHistory: [],
    gameOver: false,
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
            // Reveal all dealer cards if game is over
            // The logic here is already correct: if gameState.gameOver is true, all cards are shown.
            if (index === 1 && !gameState.gameOver) { //
                cardDiv.className = 'card hidden';
                cardDiv.textContent = '?';
            } else {
                cardDiv.className = `card ${getCardColor(card)}`;
                cardDiv.textContent = getCardDisplay(card);
            }
            elements.dealerHand.appendChild(cardDiv);
        });

        if (gameState.gameOver) { //
            elements.dealerValue.textContent = `Value: ${calculateHandValue(gameState.dealer)}`; //
        } else {
            // Show only first card value
            const visibleValue = gameState.dealer.length > 0 ? calculateHandValue([gameState.dealer[0]]) : 0; //
            elements.dealerValue.textContent = `Value: ${visibleValue}`; //
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
        await makeApiCall('/new_game', 'POST'); //

        // Reset local state
        gameState.player = []; //
        gameState.dealer = []; //
        gameState.moveHistory = []; //
        gameState.gameOver = false; //
        gameState.gameStarted = true;

        // Get the initial game state after new game
        await getGameState(); //
        updateStatus('New game started! Make your move.');
        // Ensure MCTS results section is hidden at the start of a new game
        elements.mctsResults.style.display = 'none'; //
        updateDisplay(); //
    } catch (error) {
        console.error('Error starting new game:', error);
    }
}

async function playerHit() {
    try {
        await makeApiCall('/player_hit', 'POST'); //
        await getGameState(); //

        const playerValue = calculateHandValue(gameState.player); //
        if (playerValue > 21) {
            gameState.gameOver = true; //
            await dealerPlay(); // Ensure dealer's hand is revealed
            await checkGameResult(); //
        } else if (playerValue === 21) {
            gameState.gameOver = true; //
            await dealerPlay(); // Ensure dealer's hand is revealed
            await checkGameResult(); //
        } else {
            updateStatus('Card taken. Make your next move.');
        }

        updateDisplay(); // This call happens after the dealerPlay(), so it should be correct
    } catch (error) {
        console.error('Error hitting:', error);
    }
}

async function playerStand() {
    try {
        await makeApiCall('/player_stand', 'POST'); //
        gameState.gameOver = true; //
        await dealerPlay(); //
        await checkGameResult(); //
        updateDisplay(); //
    } catch (error) {
        console.error('Error standing:', error);
    }
}

async function dealerPlay() {
    try {
        await makeApiCall('/dealer_play', 'POST'); //
        await getGameState(); //
    } catch (error) {
        console.error('Error with dealer play:', error);
    }
}

async function checkGameResult() {
    try {
        const result = await makeApiCall('/game_result'); //
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
        await makeApiCall('/undo_move', 'POST'); //
        await getGameState(); //
        updateStatus('Move undone.');
        updateDisplay(); //
    } catch (error) {
        console.error('Error undoing move:', error);
    }
}

async function letComputerDecide() {
    try {
        updateStatus('Computer is thinking... 🤔');
        elements.computerBtn.disabled = true; //

        const result = await makeApiCall('/mcts_simulate'); //
        if (result && result.action) {
            const { action } = result; // Only get the action, not children

            // Display MCTS recommendation, hiding detailed results
            displayMCTSRecommendation(action); //

            // Execute the recommended action
            if (action === 'hit') {
                await playerHit(); //
            } else {
                await playerStand(); //
            }
        }
    } catch (error) {
        console.error('Error with computer decision:', error);
        updateStatus('Error getting computer recommendation');
    } finally {
        elements.computerBtn.disabled = false; //
    }
}

// Get current game state from the backend
async function getGameState() {
    try {
        const result = await makeApiCall('/game_state'); //
        if (result) {
            gameState.player = result.player || []; //
            gameState.dealer = result.dealer || []; //
            gameState.moveHistory = result.move_history || []; //
            gameState.gameOver = result.game_over || false; //
        }
    } catch (error) {
        console.error('Error getting game state:', error);
    }
}

// Modified to only show recommendation, not simulation results
function displayMCTSRecommendation(recommendedAction) {
    elements.mctsRecommendation.innerHTML = `
        <strong>Computer recommends: ${recommendedAction.toUpperCase()}</strong>
    `;
    elements.mctsChildren.innerHTML = ''; // Clear children results
    // Hide the mcts-details div to remove the "Simulation Results:" heading
    document.querySelector('.mcts-details').style.display = 'none'; // NEW: Hide the simulation details container
    elements.mctsResults.style.display = 'block'; // Show the overall MCTS section
}

function updateStatus(message, type = '') {
    elements.gameStatus.innerHTML = `<p>${message}</p>`; //
    elements.gameStatus.className = `status ${type}`; //
}

// Event listeners
elements.hitBtn.addEventListener('click', playerHit); //
elements.standBtn.addEventListener('click', playerStand); //
elements.computerBtn.addEventListener('click', letComputerDecide); //
elements.undoBtn.addEventListener('click', undoMove); //
elements.newGameBtn.addEventListener('click', newGame); //

// Initialize game
async function initializeGame() {
    updateStatus('Click "New Game" to start playing!');
    updateDisplay(); //
    // Ensure the MCTS results and simulation details are hidden on initial load
    elements.mctsResults.style.display = 'none';
    document.querySelector('.mcts-details').style.display = 'none'; // NEW: Hide the simulation details container on load
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', initializeGame);
