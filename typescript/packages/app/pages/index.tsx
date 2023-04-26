import { Box } from "@mui/system";
import { Button, Typography } from "@mui/material";
import * as React from "react";

const Home: React.FC = () => {
  const { gameState, hitMe, resetState } = useGameState();
  return (
    <RenderGameState
      gameState={gameState}
      hitMe={hitMe}
      resetState={resetState}
    />
  );
};

export default Home;

const useGameState = () => {
  const [gameState, setGameState] = React.useState<GameState>(() => ({
    deck: [],
    playerHand: [],
  }));

  const resetState = () => setGameState(initGameState());

  React.useEffect(resetState, []);

  const hitMe = () => {
    const result = hit(1, gameState.deck);

    setGameState({
      deck: result.newDeck,
      playerHand: [...gameState.playerHand, ...result.cards],
    });
  };

  return { gameState, setGameState, hitMe, resetState };
};

const RenderGameState: React.FC<{
  gameState: GameState;
  hitMe: () => void;
  resetState: () => void;
}> = ({ gameState, hitMe, resetState }) => {
  const score = computeScore(gameState.playerHand);

  const isWin = score === 21;
  const isBust = score > 21;

  return (
    <Box display="flex" flexDirection="column" gap={3} padding={3}>
      <RenderScore score={score} />

      <RenderHand cards={gameState.playerHand} />
      <Box width="200px">
        <Button variant="contained" disabled={isWin || isBust} onClick={hitMe}>
          Hit Me
        </Button>
      </Box>
      {isWin && <Typography>You win!</Typography>}
      {isBust && <Typography>You lost!</Typography>}
      {(isWin || isBust) && <Button onClick={resetState}>Play again</Button>}
    </Box>
  );
};

const RenderScore: React.FC<{
  score: number;
}> = ({ score }) => {
  return <Typography>Your score is: {score}</Typography>;
};

const RenderHand: React.FC<{ cards: Card[] }> = ({ cards }) => {
  return (
    <Box display="flex" gap={3}>
      {cards.map((card, index) => (
        <Box
          key={index}
          border="1px solid black"
          height="100px"
          display="flex"
          alignItems="center"
          paddingX={1}
        >
          <RenderCard card={card} />
        </Box>
      ))}
    </Box>
  );
};

const RenderCard: React.FC<{ card: Card }> = ({ card }) => {
  switch (card.type) {
    case "numeric":
      return (
        <Typography>
          {card.value} of {card.suit}
        </Typography>
      );
    case "special":
      return (
        <Typography>
          {card.value} of {card.suit}
        </Typography>
      );
    default:
      throw new Error("illegal state");
  }
};

const SUITES = ["Hearts", "Diamonds", "Spades", "Clubs"] as const;
type Suit = (typeof SUITES)[number];

const NUMERIC = [2, 3, 4, 5, 6, 7, 8, 9, 10];
type Numeric = (typeof NUMERIC)[number];

const SPECIAL = ["Jack", "Queen", "King", "Ace"] as const;
type Special = (typeof SPECIAL)[number];

type Card =
  | {
      type: "numeric";
      suit: Suit;
      value: Numeric;
    }
  | {
      type: "special";
      suit: Suit;
      value: Special;
    };

type Deck = Card[];

// todo win / loss state?

export interface GameState {
  deck: Deck;
  playerHand: Card[];
}

function computeScore(hand: Card[]): number {
  let acc = 0;

  for (const card of hand) {
    switch (card.type) {
      case "special":
        switch (card.value) {
          case "Jack":
          case "King":
          case "Queen":
            acc += 10;
            break;
          case "Ace":
            // todo: handle ace
            if (acc + 11 > 21) {
              acc += 1;
            } else {
              acc += 11;
            }
            break;

          default:
            throw new Error("illegal state");
        }
        break;
      case "numeric":
        acc += card.value;
        break;
      default:
        throw new Error("Invalid card type");
    }
  }

  return acc;
}

interface HitResult {
  newDeck: Deck;
  cards: Card[];
}

function initGameState() {
  const init = createDeck();
  shuffle(init);

  const hitResult = hit(2, init);
  return {
    deck: hitResult.newDeck,
    playerHand: hitResult.cards,
  };
}

function hit(numWanted: number, deck: Deck): HitResult {
  const cards: Card[] = [];
  const copy = [...deck];

  while (cards.length != numWanted) {
    const card = copy.pop();
    if (card === undefined) {
      throw new Error("Deck is empty?");
    }
    cards.push(card);
  }
  return {
    newDeck: copy,
    cards,
  };
}

function createDeck(): Deck {
  const acc: Card[] = [];

  for (const suit of SUITES) {
    for (const numeric of NUMERIC) {
      acc.push({
        type: "numeric",
        suit: suit,
        value: numeric,
      });
    }

    for (const special of SPECIAL) {
      acc.push({
        type: "special",
        suit: suit,
        value: special,
      });
    }
  }

  return acc;
}

function shuffle<T>(array: T[]) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex] as any, array[randomIndex] as any] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
}
