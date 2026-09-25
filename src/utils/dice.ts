export const rollDice = (max: number = 6) => {
  const roll = Math.floor(Math.random() * max) + 1;
  return roll;
};
