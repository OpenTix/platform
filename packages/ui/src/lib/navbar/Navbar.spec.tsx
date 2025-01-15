import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Navbar } from './Navbar';

// Adjust path as needed

describe('Navbar', () => {
	it('renders without crashing', () => {
		render(<Navbar>Test Children</Navbar>);
		expect(screen.getByText('Test Children')).toBeInTheDocument();
	});

	it('renders children correctly', () => {
		render(
			<Navbar>
				<div data-testid="child-element">Child Content</div>
			</Navbar>
		);
		expect(screen.getByTestId('child-element')).toHaveTextContent(
			'Child Content'
		);
	});

	it('matches snapshot', () => {
		const { asFragment } = render(<Navbar>Snapshot Test</Navbar>);
		expect(asFragment()).toMatchSnapshot();
	});
});
