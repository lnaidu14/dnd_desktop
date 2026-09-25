import { useState } from 'react';
import { rollDice } from "../../../utils/dice";
import { Button, Select } from "@mantine/core";

export default function DiceRoller() {
  const [result, setResult] = useState<number | null>(null);
  const [diceSize, setDiceSize] = useState<string | null>("6");

  const handleRoll = () => {
    const maxBound = diceSize ? parseInt(diceSize, 10) : 6;

    const score = rollDice(maxBound);
    setResult(score);
  };

  return (
    <div>
      <h1>Dice Roller</h1>
      <Select
        label="Select Die Type"
        placeholder="Pick a die"
        value={diceSize}
        onChange={setDiceSize}
        data={["4", "6", "8", "10", "12", "20", "100"]}
      />

      <Button variant="default" onClick={handleRoll} mt="md">
        Roll D{diceSize || 6}
      </Button>

      {result !== null && <p data-testid="dice-result">Result: {result}</p>}
    </div>
  );
}
