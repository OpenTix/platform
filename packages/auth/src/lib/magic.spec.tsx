// magic.spec.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Magic } from 'magic-sdk';
import '@testing-library/jest-dom';
import { MagicProvider, useMagic } from './magic';
import { useNavigate } from 'react-router-dom';

/**
 * 1) Mock environment variable
 * 2) Mock Magic SDK
 * 3) Mock useNavigate from react-router-dom
 */
const REAL_ENV = { ...process.env };

jest.mock('magic-sdk', () => {
	return {
		Magic: jest.fn(() => ({
			user: {
				onUserLoggedOut: jest.fn(),
			},
		})),
	};
});

jest.mock('react-router-dom', () => {
	const actual = jest.requireActual('react-router-dom');
	return {
		...actual,
		useNavigate: jest.fn(),
	};
});

describe('MagicProvider', () => {
	let mockNavigate: jest.Mock;

	beforeEach(() => {
		// Restore a valid environment before each test
		process.env = { ...REAL_ENV };
		process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY = 'TEST_PUBLIC_KEY';

		// Reset mocks
		(Magic as jest.Mock).mockClear();
		mockNavigate = jest.fn();
		(useNavigate as jest.Mock).mockReturnValue(mockNavigate);
	});

	afterAll(() => {
		process.env = REAL_ENV; // restore original env
	});

	it('throws an error if NX_PUBLIC_MAGIC_PUBLISHABLE_KEY is missing', () => {
		delete process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY;

		// Because the provider checks this at import time, we must import
		// the file again or test it in a separate environment. Typically,
		// you might test it by wrapping your app or mocking the import.
		// Here is a simplified approach:

		// We'll force a re-require to run the top-level check again
		expect(() => {
			jest.isolateModules(() => {
				require('./magic');
			});
		}).toThrow('Missing Magic public key');
	});

	it('does not throw an error if NX_PUBLIC_MAGIC_PUBLISHABLE_KEY is present', () => {
		expect(() => {
			render(
				<MagicProvider>
					<div>Child</div>
				</MagicProvider>
			);
		}).not.toThrow();
		expect(screen.getByText('Child')).toBeInTheDocument();
	});

	it('initializes Magic with the correct arguments', () => {
		render(
			<MagicProvider>
				<div>Child</div>
			</MagicProvider>
		);

		// Expect Magic constructor to have been called once
		expect(Magic).toHaveBeenCalledTimes(1);

		// Check the args used in the Magic constructor
		expect(Magic).toHaveBeenCalledWith('TEST_PUBLIC_KEY', {
			network: {
				rpcUrl: 'https://goerli.optimism.io',
				chainId: 420,
			},
			useStorageCache: true,
		});
	});

	it('calls magic.user.onUserLoggedOut and navigates to / on logout', () => {
		// We have a mock to see how onUserLoggedOut is called
		const mockOnUserLoggedOut = jest.fn();
		(Magic as jest.Mock).mockImplementation(() => ({
			user: {
				onUserLoggedOut: mockOnUserLoggedOut,
			},
		}));

		render(
			<MagicProvider>
				<div>Child</div>
			</MagicProvider>
		);

		// The MagicProvider sets up the onUserLoggedOut callback
		expect(mockOnUserLoggedOut).toHaveBeenCalledTimes(1);

		// Get the actual logout callback
		const logoutCallback = mockOnUserLoggedOut.mock.calls[0][0];
		expect(typeof logoutCallback).toBe('function');

		// Invoke the callback manually to simulate a logout
		logoutCallback();
		expect(mockNavigate).toHaveBeenCalledWith('/');
	});

	it('renders children properly', () => {
		render(
			<MagicProvider>
				<div data-testid="child-content">Hello World</div>
			</MagicProvider>
		);
		expect(screen.getByTestId('child-content')).toBeInTheDocument();
	});
});

describe('useMagic hook', () => {
	// A test component to consume the Magic context
	const TestComponent = () => {
		const magic = useMagic();
		return (
			<div data-testid="magic-test">
				{magic ? 'Has Magic' : 'No Magic'}
			</div>
		);
	};

	it('returns Magic instance within MagicProvider', () => {
		render(
			<MagicProvider>
				<TestComponent />
			</MagicProvider>
		);
		expect(screen.getByTestId('magic-test')).toHaveTextContent('Has Magic');
	});

	it('throws an error if used outside of MagicProvider', () => {
		// We test that calling `useMagic()` outside of the provider’s context
		// will cause the hook to throw an error.
		const originalError = console.error;
		console.error = jest.fn(); // silence expected error logs

		expect(() => render(<TestComponent />)).toThrow(
			'useMagic must be used within a MagicProvider'
		);

		console.error = originalError; // restore error
	});
});
