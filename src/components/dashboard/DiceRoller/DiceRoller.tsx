import { useState } from 'react';
import { rollDice } from "../../../utils/dice";
import {
  Button,
  Select,
  SegmentedControl,
  Text,
  NumberInput,
  Group,
} from "@mantine/core";
import { AnimatePresence } from "framer-motion";
import AnimatedDice from "./AnimatedDice";

interface RollBreakdown {
  rawRoll: number;
  modifier: number;
  total: number;
}

export default function DiceRoller() {
  const [diceSize, setDiceSize] = useState<string | null>("20");
  const [rollerMode, setRollerMode] = useState<string>("simple");
  const [isAnimating, setIsAnimating] = useState(false);
  const [modifier, setModifier] = useState<number | string>(0);

  const [breakdown, setBreakdown] = useState<RollBreakdown | null>(null);

  const handleRoll = () => {
    const maxBound = diceSize ? parseInt(diceSize, 10) : 20;
    const rawRoll = rollDice(maxBound);

    const staticBonus =
      typeof modifier === "number" ? modifier : parseInt(modifier, 10) || 0;

    const totalScore = rawRoll + staticBonus;

    setBreakdown({
      rawRoll,
      modifier: staticBonus,
      total: totalScore,
    });

    if (rollerMode === "animated") {
      setIsAnimating(true);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", paddingTop: "2rem" }}>
      <h1>Dice Roller</h1>

      <Text size="sm" fw={500} mb={3}>
        Roller Style
      </Text>
      <SegmentedControl
        value={rollerMode}
        onChange={setRollerMode}
        data={[
          { label: "Simple", value: "simple" },
          { label: "Animated", value: "animated" },
        ]}
        mb="md"
        fullWidth
      />

      <Group grow mb="md">
        <Select
          label="Select Die Type"
          placeholder="Pick a die"
          value={diceSize}
          onChange={setDiceSize}
          data={["4", "6", "8", "10", "12", "20", "100"]}
        />

        <NumberInput
          label="Modifier"
          placeholder="+0"
          value={modifier}
          onChange={setModifier}
          allowDecimal={false}
        />
      </Group>

      <Button
        variant="filled"
        color="blue"
        onClick={handleRoll}
        fullWidth
        size="md"
      >
        Roll D{diceSize || 20}
      </Button>

      {rollerMode === "simple" && breakdown !== null && (
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <Text
            size="xs"
            color="dimmed"
            style={{ letterSpacing: "1px", textTransform: "uppercase" }}
          >
            Breakdown: {breakdown.rawRoll} (d{diceSize})
            {breakdown.modifier >= 0
              ? `+ ${breakdown.modifier}`
              : `- ${Math.abs(breakdown.modifier)}`}{" "}
            mod
          </Text>
          <p
            data-testid="dice-result"
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              margin: "4px 0 0 0",
            }}
          >
            Total: {breakdown.total}
          </p>
        </div>
      )}

      <AnimatePresence>
        {isAnimating && breakdown !== null && (
          <AnimatedDice
            rawRoll={breakdown.rawRoll}
            modifier={breakdown.modifier}
            targetResult={breakdown.total}
            diceType={diceSize || "20"}
            onClose={() => setIsAnimating(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
