import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { NavLink } from './NavLink';

// Adjust path as needed

describe('NavLink', () => {
	it('renders the link and children', () => {
		render(
			<MemoryRouter>
				<NavLink to="/test-path">Test Link</NavLink>
			</MemoryRouter>
		);
		// The link text should be in the document
		expect(screen.getByText('Test Link')).toBeInTheDocument();
	});

	it('has the correct "to" attribute', () => {
		render(
			<MemoryRouter>
				<NavLink to="/another-path">Another Link</NavLink>
			</MemoryRouter>
		);
		const link = screen.getByText('Another Link') as HTMLAnchorElement;
		expect(link.getAttribute('href')).toBe('/another-path');
	});

	it('matches snapshot', () => {
		const { asFragment } = render(
			<MemoryRouter>
				<NavLink to="/">Snapshot Test</NavLink>
			</MemoryRouter>
		);
		expect(asFragment()).toMatchSnapshot();
	});
});
