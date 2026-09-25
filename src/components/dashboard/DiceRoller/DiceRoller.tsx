import { useState } from 'react';
import { rollDice } from "../../../utils/dice";

export default function DiceRoller() {
  const [result, setResult] = useState<number | null>(null);

  // Create a handler function that calls your utility and updates the state
  const handleRoll = () => {
    const score = rollDice();
    setResult(score);
  };

  return (
    <div>
      <h1>Dice Roller</h1>
      {/* Attach the handler function here */}
      <button onClick={handleRoll}>Roll Dice</button>
      {result !== null && <p data-testid="dice-result">Result: {result}</p>}
    </div>
  );
}
