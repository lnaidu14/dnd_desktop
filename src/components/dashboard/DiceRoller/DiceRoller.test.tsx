import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DiceRoller from './DiceRoller';

describe('DiceRoller Component', () => {
  test('renders initial layout correctly', () => {
    render(<DiceRoller />);
    
    expect(screen.getByRole('heading', { name: /dice roller/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
    // Verify that no result text is showing initially
    expect(screen.queryByTestId('dice-result')).not.toBeInTheDocument();
  });

  test('displays a number between 1 and 6 when the button is clicked', async () => {
    // Arrange
    render(<DiceRoller />);
    const button = screen.getByRole('button', { name: /roll dice/i });

    // Act: Simulate human user interaction
    await userEvent.click(button);

    // Assert: Find the result element
    const resultElement = screen.getByTestId('dice-result');
    expect(resultElement).toBeInTheDocument();

    // Check that the text matches a number from 1 to 6
    const textContent = resultElement.textContent; // e.g., "Result: 4"
    expect(textContent).toMatch(/Result: [1-6]/);
  });
});
