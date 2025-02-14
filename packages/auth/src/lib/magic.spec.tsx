import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Magic } from 'magic-sdk';
import React from 'react';
import { MagicProvider, useMagic } from './magic';

// Set default environment variables for tests.
process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY =
	process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY || 'test-key';
process.env.NX_PUBLIC_RPC_URL =
	process.env.NX_PUBLIC_RPC_URL || 'http://localhost:8545';
process.env.NX_PUBLIC_CHAIN_ID = process.env.NX_PUBLIC_CHAIN_ID || '1';

// jest.mock must come before importing the module that uses it.
jest.mock('magic-sdk', () => {
	// Create a mock Magic constructor.
	const Magic = jest.fn().mockImplementation((publicKey, options) => {
		return { publicKey, options, isMagic: true };
	});
	return { Magic };
});

describe('MagicProvider and useMagic', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('renders children inside MagicProvider', () => {
		render(
			<MagicProvider>
				<div data-testid="child">Child Content</div>
			</MagicProvider>
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	test('calls Magic constructor with correct parameters', () => {
		render(
			<MagicProvider>
				<div>Test</div>
			</MagicProvider>
		);
		expect(Magic).toHaveBeenCalledTimes(1);
		expect(Magic).toHaveBeenCalledWith(
			process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY,
			{
				network: {
					rpcUrl: process.env.NX_PUBLIC_RPC_URL,
					chainId: parseInt(
						process.env.NX_PUBLIC_CHAIN_ID as string,
						10
					)
				},
				useStorageCache: true
			}
		);
	});

	test('useMagic hook returns the Magic instance provided by MagicProvider', () => {
		const TestComponent = () => {
			const magic = useMagic();
			// Render some property from the magic instance so we can verify it's there.
			return (
				<div data-testid="magic">
					{magic.isMagic ? 'Magic Loaded' : 'No Magic'}
				</div>
			);
		};

		render(
			<MagicProvider>
				<TestComponent />
			</MagicProvider>
		);
		expect(screen.getByTestId('magic')).toHaveTextContent('Magic Loaded');
	});

	test('Magic instance is created only once across multiple consumers', () => {
		let instance1: any, instance2: any;

		const Component1 = () => {
			instance1 = useMagic();
			return null;
		};

		const Component2 = () => {
			instance2 = useMagic();
			return null;
		};

		render(
			<MagicProvider>
				<Component1 />
				<Component2 />
			</MagicProvider>
		);

		expect(instance1).toBe(instance2);
		// Also verify that the Magic constructor was called only once.
		expect(Magic).toHaveBeenCalledTimes(1);
	});

	test('useMagic hook throws an error when used outside MagicProvider', () => {
		const ProblemComponent = () => {
			useMagic();
			return <div>Problem</div>;
		};

		// Suppress the React error boundary logging for this test.
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			//eslint-disable-next-line
			.mockImplementation(() => {});

		expect(() => render(<ProblemComponent />)).toThrow(
			'useMagic must be used within a MagicProvider'
		);

		consoleErrorSpy.mockRestore();
	});
});

describe('Environment variable errors', () => {
	const OLD_ENV = process.env;

	beforeEach(() => {
		// Clear the module cache so that changes to process.env take effect.
		jest.resetModules();
		process.env = { ...OLD_ENV };
	});

	afterEach(() => {
		process.env = OLD_ENV;
	});

	test('throws error if NX_PUBLIC_MAGIC_PUBLISHABLE_KEY is missing', () => {
		delete process.env.NX_PUBLIC_MAGIC_PUBLISHABLE_KEY;
		expect(() => {
			require('./magic');
		}).toThrow('Missing Magic public key');
	});

	test('throws error if NX_PUBLIC_RPC_URL is missing', () => {
		delete process.env.NX_PUBLIC_RPC_URL;
		expect(() => {
			require('./magic');
		}).toThrow('Missing RPC URL');
	});

	test('throws error if NX_PUBLIC_CHAIN_ID is missing', () => {
		delete process.env.NX_PUBLIC_CHAIN_ID;
		expect(() => {
			require('./magic');
		}).toThrow('Missing Chain ID');
	});
});
