import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React, { useEffect, useState } from 'react';
import { TokenProvider, useToken } from './token';

// MOCK: Override useMagic from './magic' and expose the internal mock.
// Define the mock function inside the factory so that no out‐of‐scope variables are referenced.
jest.mock('./magic', () => {
	const getIdTokenMock = jest.fn().mockResolvedValue('new-token');
	return {
		useMagic: () => ({
			user: {
				getIdToken: getIdTokenMock
			}
		}),
		__esModule: true,
		_getIdTokenMock: getIdTokenMock
	};
});

// Use require to access the internal mock function
const { _getIdTokenMock } = require('./magic');

const TOKEN_VALIDITY_DURATION = 14 * 60 * 1000; // as defined in token.tsx

describe('TokenProvider and useToken', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test('renders children inside TokenProvider', () => {
		render(
			<TokenProvider>
				<div data-testid="child">Child Content</div>
			</TokenProvider>
		);
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	test('getToken regenerates token when none is stored', async () => {
		const TestComponent = () => {
			const { getToken } = useToken();
			const [tokenValue, setTokenValue] = useState('');
			useEffect(() => {
				getToken().then(setTokenValue);
			}, [getToken]);
			return <div data-testid="token">{tokenValue}</div>;
		};

		render(
			<TokenProvider>
				<TestComponent />
			</TokenProvider>
		);

		const tokenDiv = await screen.findByTestId('token');
		expect(tokenDiv).toHaveTextContent('new-token');
		expect(_getIdTokenMock).toHaveBeenCalledTimes(1);
	});

	test('getToken returns stored token when valid', async () => {
		const TestComponent = () => {
			const { token, storeToken, getToken } = useToken();
			const [tokenValue, setTokenValue] = useState('');
			// store a token.
			useEffect(() => {
				storeToken('stored-token');
			}, [storeToken]);
			// once token is set, call getToken.
			useEffect(() => {
				if (token !== null) {
					getToken().then(setTokenValue);
				}
			}, [token, getToken]);
			return <div data-testid="token">{tokenValue}</div>;
		};

		render(
			<TokenProvider>
				<TestComponent />
			</TokenProvider>
		);

		const tokenDiv = await screen.findByTestId('token');
		expect(tokenDiv).toHaveTextContent('stored-token');
		expect(_getIdTokenMock).not.toHaveBeenCalled();
	});

	test('getToken regenerates token when stored token is expired', async () => {
		// Spy on Date.now() to simulate token creation time and later expiry.
		const nowSpy = jest.spyOn(Date, 'now');
		// Before storing token, simulate Date.now() returns 1000.
		nowSpy.mockReturnValue(1000);

		const TestComponent = () => {
			const { token, storeToken, getToken } = useToken();
			const [tokenValue, setTokenValue] = useState('');
			const [called, setCalled] = useState(false);

			// Store a token at time = 1000.
			useEffect(() => {
				storeToken('stored-token');
			}, [storeToken]);

			// Once token is set and if we haven't already called getToken, simulate time advancement and call getToken.
			useEffect(() => {
				if (token !== null && !called) {
					setCalled(true);
					nowSpy.mockReturnValue(1000 + TOKEN_VALIDITY_DURATION + 1);
					getToken().then(setTokenValue);
				}
			}, [token, getToken, called]);

			return <div data-testid="token">{tokenValue}</div>;
		};

		render(
			<TokenProvider>
				<TestComponent />
			</TokenProvider>
		);

		const tokenDiv = await screen.findByTestId('token');
		expect(tokenDiv).toHaveTextContent('new-token');
		// Expect regeneration to have occurred only once.
		expect(_getIdTokenMock).toHaveBeenCalledTimes(1);
		nowSpy.mockRestore();
	});

	test('useToken hook throws error when used outside TokenProvider', () => {
		const ProblemComponent = () => {
			useToken();
			return <div>Should not render</div>;
		};

		// Suppress React error logging for this test.
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			//eslint-disable-next-line
			.mockImplementation(() => {});
		expect(() => render(<ProblemComponent />)).toThrow(
			'useToken must be used within a TokenProvider'
		);
		consoleErrorSpy.mockRestore();
	});
});
