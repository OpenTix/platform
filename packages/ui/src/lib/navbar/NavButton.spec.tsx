import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { NavButton } from './NavButton';

// Adjust path as needed

describe('NavButton', () => {
	it('renders with default (filled) variant', () => {
		render(<NavButton>Click Me</NavButton>); // Default variant is 'filled'
		const button = screen.getByRole('button', { name: /click me/i });
		expect(button).toBeInTheDocument();
		// Optionally check styling or class if needed
	});

	it('renders with outline variant', () => {
		render(<NavButton variant="outline">Outline Button</NavButton>);
		const button = screen.getByRole('button', { name: /outline button/i });
		expect(button).toBeInTheDocument();
		// Optionally check styling or class if needed
	});

	it('calls onClick handler', () => {
		const handleClick = jest.fn();
		render(<NavButton onClick={handleClick}>Click Handler Test</NavButton>);
		const button = screen.getByRole('button', {
			name: /click handler test/i
		});
		fireEvent.click(button);
		expect(handleClick).toHaveBeenCalledTimes(1);
	});

	it('disables button when disabled prop is passed', () => {
		render(<NavButton disabled>Disabled Button</NavButton>);
		const button = screen.getByRole('button', { name: /disabled button/i });
		expect(button).toBeDisabled();
	});

	it('matches snapshot', () => {
		const { asFragment } = render(<NavButton>Snapshot Test</NavButton>);
		expect(asFragment()).toMatchSnapshot();
	});
});
