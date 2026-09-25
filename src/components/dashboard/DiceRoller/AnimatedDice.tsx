import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Button, Text } from '@mantine/core';

interface AnimatedDiceProps {
  rawRoll: number;
  modifier: number;
  targetResult: number;
  diceType: string;
  onClose: () => void;
}

export default function AnimatedDice({ rawRoll, modifier, targetResult, diceType, onClose }: AnimatedDiceProps) {
  const [isSpinning, setIsSpinning] = useState(true);
  const [displayNumber, setDisplayNumber] = useState<number | string>("?");

  useEffect(() => {
    const interval = setInterval(() => {
      if (isSpinning) {
        const randomFace = Math.floor(Math.random() * parseInt(diceType, 10)) + 1;
        setDisplayNumber(randomFace);
      }
    }, 60);

    const timeout = setTimeout(() => {
      setIsSpinning(false);
      clearInterval(interval);
      setDisplayNumber(rawRoll);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isSpinning, rawRoll, diceType]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#aaa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '3rem' }}>
          Rolling D{diceType}
        </h2>

        <motion.div
          animate={isSpinning ? {
            x: [0, -12, 12, -12, 12, -6, 6, 0],
            y: [0, 8, -12, 10, -6, 8, 0],
            rotate: [0, -15, 20, -20, 15, 0],
          } : { scale: [1, 1.3, 1] }}
          transition={isSpinning ? {
            repeat: Infinity,
            duration: 0.4,
            ease: "easeInOut"
          } : { duration: 0.3 }}
          style={{
            width: '120px',
            height: '120px',
            background: isSpinning 
              ? 'linear-gradient(135deg, #2c2c2c, #1a1a1a)' 
              : 'linear-gradient(135deg, #8a2be2, #4b0082)',
            border: isSpinning ? '2px solid #555' : '3px solid #d4af37',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isSpinning ? 'none' : '0 0 30px rgba(138, 43, 226, 0.6)',
            margin: '0 auto 1.5rem auto',
          }}
        >
          <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>
            {displayNumber}
          </span>
        </motion.div>

        {!isSpinning && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '2.5rem' }}
          >
            <Text size="xl" fw={700} color="white" style={{ fontSize: '32px' }}>
              Total: {targetResult}
            </Text>
            <Text size="sm" color="dimmed" mt={4}>
              {rawRoll} (D{diceType}) {modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`} mod
            </Text>
          </motion.div>
        )}

        {!isSpinning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button color="violet" size="md" onClick={onClose}>
              Accept Fate
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
