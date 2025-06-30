import random
import copy
import math


class Deck:
    def __init__(self):
        self.cards = ["2c", "2d", "2h", "2s", "3c", "3d", "3h", "3s", "4c", "4d", "4h", "4s", "5c", "5d", "5h", "5s",
                      "6c", "6d", "6h", "6s", "7c", "7d", "7h", "7s", "8c", "8d", "8h", "8s", "9c", "9d", "9h", "9s",
                      "Tc", "Td", "Th", "Ts", "Jc", "Jd", "Jh", "Js", "Qc", "Qd", "Qh", "Qs", "Kc", "Kd", "Kh", "Ks",
                      "Ac", "Ad", "Ah", "As"]
        self.shuffle()

    def reset(self):
        self.cards = ["2c", "2d", "2h", "2s", "3c", "3d", "3h", "3s", "4c", "4d", "4h", "4s", "5c", "5d", "5h", "5s",
                      "6c", "6d", "6h", "6s", "7c", "7d", "7h", "7s", "8c", "8d", "8h", "8s", "9c", "9d", "9h", "9s",
                      "Tc", "Td", "Th", "Ts", "Jc", "Jd", "Jh", "Js", "Qc", "Qd", "Qh", "Qs", "Kc", "Kd", "Kh", "Ks",
                      "Ac", "Ad", "Ah", "As"]
        self.shuffle()

    def shuffle(self):
        random.shuffle(self.cards)

    def draw(self):
        return self.cards.pop() if self.cards else None

    def cards_remaining(self):
        return len(self.cards)


class MCTSNode:
    def __init__(self, game_state, action=None, parent=None):
        self.game_state = game_state
        self.action = action  # 'hit' or 'stand'
        self.parent = parent
        self.children = []
        self.visits = 0
        self.wins = 0
        self.untried_actions = ['hit', 'stand']

    def is_fully_expanded(self):
        return len(self.untried_actions) == 0

    def is_terminal(self):
        # Terminal if player busted, has 21, or stood
        player_value = self.game_state.value(self.game_state.player)
        return player_value > 21 or player_value == 21 or self.action == 'stand'

    def ucb1_value(self, exploration_constant=1.4):
        if self.visits == 0:
            return float('inf')
        return (self.wins / self.visits) + exploration_constant * math.sqrt(math.log(self.parent.visits) / self.visits)

    def add_child(self, action):
        new_game_state = copy.deepcopy(self.game_state)
        if action == 'hit':
            new_game_state.take(new_game_state.player)

        child = MCTSNode(new_game_state, action, self)
        self.children.append(child)
        self.untried_actions.remove(action)
        return child

    def best_child(self, exploration_constant=1.4):
        return max(self.children, key=lambda c: c.ucb1_value(exploration_constant))

    def backup(self, result):
        self.visits += 1
        self.wins += result
        if self.parent:
            self.parent.backup(result)


class Game:
    def __init__(self):
        self.deck = Deck()
        self.player = []
        self.dealer = []
        self.move_history = []

        # Deal initial cards
        for i in range(2):
            self.player.append(self.deck.draw())
            self.dealer.append(self.deck.draw())

    def take(self, hand):
        if self.deck.cards_remaining() == 0:
            return False
        hand.append(self.deck.draw())
        return self.value(hand) <= 21

    def value(self, hand):
        val = 0
        aces = 0

        for card in hand:
            if card is None:
                continue
            rank = card[0]
            if rank in '23456789':
                val += int(rank)
            elif rank == 'T':
                val += 10
            elif rank in 'JQK':
                val += 10
            elif rank == 'A':
                val += 11
                aces += 1

        # Adjust for aces
        while val > 21 and aces > 0:
            val -= 10
            aces -= 1

        return val

    def dealer_play(self):
        """Dealer plays according to standard rules: hit on 16, stand on 17"""
        while self.value(self.dealer) < 17:
            if not self.take(self.dealer):
                break

    def game_result(self):
        """Returns 1 for player win, -1 for player loss, 0 for tie"""
        player_value = self.value(self.player)

        # Player busted
        if player_value > 21:
            return -1

        # Dealer plays
        temp_game = copy.deepcopy(self)
        temp_game.dealer_play()
        dealer_value = temp_game.value(temp_game.dealer)

        # Dealer busted
        if dealer_value > 21:
            return 1

        # Compare values
        if player_value > dealer_value:
            return 1
        elif player_value < dealer_value:
            return -1
        else:
            return 0

    def player_hit(self):
        """Player takes a card"""
        if self.deck.cards_remaining() > 0:
            self.move_history.append('hit')
            return self.take(self.player)
        return False

    def player_stand(self):
        """Player stands"""
        self.move_history.append('stand')
        return True

    def undo_move(self):
        """Undo the last move"""
        if self.move_history:
            last_move = self.move_history.pop()
            if last_move == 'hit' and len(self.player) > 2:
                self.player.pop()
                return True
        return False

    def new_game(self):
        """Start a new game"""
        self.deck.reset()
        self.player = []
        self.dealer = []
        self.move_history = []

        # Deal initial cards
        for i in range(2):
            self.player.append(self.deck.draw())
            self.dealer.append(self.deck.draw())

    def get_state_string(self):
        """Get a string representation of the current game state"""
        return f"Player: {self.player}, Dealer: {self.dealer[0]}X"

    def mcts_simulate(self, simulations=100):
        """Run MCTS simulation to determine best action"""
        if self.value(self.player) < 12:
            return 'hit', []

        root = MCTSNode(copy.deepcopy(self))

        for _ in range(simulations):
            # Selection
            node = root
            while node.is_fully_expanded() and not node.is_terminal():
                node = node.best_child()

            # Expansion
            if not node.is_terminal() and not node.is_fully_expanded():
                action = random.choice(node.untried_actions)
                node = node.add_child(action)

            # Simulation
            temp_game = copy.deepcopy(node.game_state)
            # Shuffle the deck to avoid perfect information
            temp_game.deck.shuffle()

            # If we just hit, check if we busted
            if node.action == 'hit' and temp_game.value(temp_game.player) > 21:
                result = -1
            # If we stood or are continuing, simulate random play
            elif node.action == 'stand' or temp_game.value(temp_game.player) == 21:
                result = temp_game.game_result()
            else:
                # Continue with random play
                while temp_game.value(temp_game.player) < 21:
                    if random.choice(['hit', 'stand']) == 'hit':
                        if not temp_game.take(temp_game.player):
                            break
                    else:
                        break
                result = temp_game.game_result()

            # Backpropagation
            node.backup(result)

        # Return the action with the highest win rate, favoring 'stand' on ties
        if root.children:
            def selection_key(child):
                win_rate = child.wins / child.visits if child.visits > 0 else 0
                # Add small bonus for 'stand' to break ties
                tie_breaker = 0.0001 if child.action == 'stand' else 0
                return win_rate + tie_breaker

            best_child = max(root.children, key=selection_key)
            return best_child.action, root.children
        else:
            return 'stand', []

    def print_status(self):
        """Print current game status"""
        player_value = self.value(self.player)
        dealer_visible = self.dealer[0] if self.dealer else "None"
        dealer_value = self.value([self.dealer[0]]) if self.dealer else 0

        print(f"\nPlayer cards: {self.player} (Value: {player_value})")
        print(f"Dealer showing: {dealer_visible} (Value: {dealer_value})")
        print(f"Moves made: {self.move_history}")

    def ask_play_again(self):
        """Ask player if they want to play again"""
        while True:
            choice = input("\nWould you like to play another game? (y/n): ").strip().lower()
            if choice in ['y', 'yes']:
                return True
            elif choice in ['n', 'no']:
                print("Thanks for playing!")
                return False
            else:
                print("Please enter 'y' for yes or 'n' for no.")


def main():
    game = Game()

    while True:
        game.print_status()

        # Check if player busted
        if game.value(game.player) > 21:
            print("Player busted! You lose.")
            if not game.ask_play_again():
                break
            game.new_game()
            continue

        # Check for blackjack
        if game.value(game.player) == 21:
            print("Blackjack! Standing automatically.")
            result = game.game_result()
            if result == 1:
                print("You win!")
            elif result == -1:
                print("Dealer wins!")
            else:
                print("Tie!")
            if not game.ask_play_again():
                break
            game.new_game()
            continue

        print("\nOptions:")
        print("1. Hit")
        print("2. Stand")
        print("3. Let computer decide")
        print("4. Undo last move")
        print("5. New game")
        print("6. Quit")

        choice = input("Enter your choice (1-6): ").strip()

        if choice == '1':
            if not game.player_hit():
                print(f"Player cards: {game.player} (Value: {game.value(game.player)})")
                print("Player busted!")
                if not game.ask_play_again():
                    break
                game.new_game()

        elif choice == '2':
            game.player_stand()
            result = game.game_result()
            game.dealer_play()
            print(f"\nFinal dealer cards: {game.dealer} (Value: {game.value(game.dealer)})")

            if result == 1:
                print("You win!")
            elif result == -1:
                print("Dealer wins!")
            else:
                print("Tie!")

            if not game.ask_play_again():
                break
            game.new_game()

        elif choice == '3':
            print("Computer is thinking...")
            action, children = game.mcts_simulate(50)

            print(f"\nMCTS Results after 50 simulations:")
            for child in children:
                win_rate = child.wins / child.visits if child.visits > 0 else 0
                print(f"Action: {child.action}, Visits: {child.visits}, Win Rate: {win_rate:.3f}")

            print(f"Computer recommends: {action}")

            if action == 'hit':
                if not game.player_hit():
                    print(f"Player cards: {game.player} (Value: {game.value(game.player)})")
                    print("Player busted!")
                    if not game.ask_play_again():
                        break
                    game.new_game()
            else:
                game.player_stand()
                result = game.game_result()
                game.dealer_play()
                print(f"\nFinal dealer cards: {game.dealer} (Value: {game.value(game.dealer)})")

                if result == 1:
                    print("You win!")
                elif result == -1:
                    print("Dealer wins!")
                else:
                    print("Tie!")

                if not game.ask_play_again():
                    break
                game.new_game()

        elif choice == '4':
            if game.undo_move():
                print("Move undone.")
            else:
                print("No moves to undo.")

        elif choice == '5':
            game.new_game()
            print("Started new game.")

        elif choice == '6':
            print("Thanks for playing!")
            break

        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()
