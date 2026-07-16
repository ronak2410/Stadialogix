import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FanMode from '@/app/(frontend)/fan/page';

// Mock Next.js dynamic imports
vi.mock('next/dynamic', () => ({
  default: () => {
    return function MockMap() {
      return <div data-testid="mock-stadium-map">Mock Map</div>;
    };
  }
}));

describe('FanMode Integration', () => {
  it('renders the chat interface and the map correctly', () => {
    render(<FanMode />);
    
    // Check initial chat message
    expect(screen.getByText(/Welcome to StadiaLogix/i)).toBeInTheDocument();
    
    // Check map mock is rendered
    expect(screen.getByTestId('mock-stadium-map')).toBeInTheDocument();
  });

  it('allows user to type in the chat input', () => {
    render(<FanMode />);
    
    const input = screen.getByPlaceholderText(/Message or upload a photo/i);
    fireEvent.change(input, { target: { value: 'Where is pizza?' } });
    
    expect(input).toHaveValue('Where is pizza?');
  });
});
