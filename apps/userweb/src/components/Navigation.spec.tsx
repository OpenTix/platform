import '@testing-library/jest-dom';
import {
	act,
	fireEvent,
	render,
	screen,
	waitFor
} from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useMagic } from '@platform/auth';
import Navigation from './Navigation';

jest.mock('@platform/auth', () => ({
	useMagic: jest.fn()
}));

jest.mock('react-router-dom', () => ({
	useNavigate: jest.fn()
}));

jest.mock('react-spinners', () => ({
	ClipLoader: () => <div data-testid="loader" />
}));

jest.mock('react-router-dom', () => ({
	...jest.requireActual('react-router-dom'), // Keep the actual implementation of other exports
	useNavigate: jest.fn(),
	Link: jest.fn(({ children, ...props }) => <a {...props}>{children}</a>)
}));

jest.useFakeTimers();

describe('Navigation component', () => {
	let mockMagic: {
		wallet: {
			connectWithUI: jest.Mock;
		};
		user: {
			isLoggedIn: jest.Mock;
			logout: jest.Mock;
		};
	};
	let mockNavigate: jest.Mock;

	beforeEach(() => {
		mockMagic = {
			wallet: {
				connectWithUI: jest.fn()
			},
			user: {
				isLoggedIn: jest.fn(),
				logout: jest.fn()
			}
		};
		mockNavigate = jest.fn();

		(useMagic as jest.Mock).mockReturnValue(mockMagic);
		(useNavigate as jest.Mock).mockReturnValue(mockNavigate);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	test('renders loading state', async () => {
		// Delay the resolution of isLoggedIn to simulate loading state
		mockMagic.user.isLoggedIn.mockImplementation(
			() =>
				new Promise((resolve) => setTimeout(() => resolve(false), 100))
		);

		await act(async () => {
			render(<Navigation />);
		});

		// Assert that the loader is displayed
		expect(screen.getByTestId('loader')).toBeInTheDocument();

		// Let the mock resolve and ensure it clears the loading state
		await act(async () => {
			jest.advanceTimersByTime(100);
		});

		// Assert that the loader is no longer displayed
		expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
	});

	test('renders Login button when user is not logged in', async () => {
		mockMagic.user.isLoggedIn.mockResolvedValue(false);

		await act(async () => {
			render(<Navigation />);
		});

		await waitFor(() => {
			expect(screen.getByText('Login')).toBeInTheDocument();
		});
	});

	test('renders Dropdown when user is logged in', async () => {
		mockMagic.user.isLoggedIn.mockResolvedValue(true);

		await act(async () => {
			render(<Navigation />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('account-icon')).toBeInTheDocument();
		});
	});

	test('calls handleLogin on Login button click', async () => {
		mockMagic.user.isLoggedIn.mockResolvedValue(false);

		await act(async () => {
			render(<Navigation />);
		});

		const loginButton = await screen.findByText('Login');
		fireEvent.click(loginButton);

		await waitFor(() => {
			expect(mockMagic.wallet.connectWithUI).toHaveBeenCalled();
			expect(mockNavigate).toHaveBeenCalledWith(0);
		});
	});

	test('handles logout from the Dropdown', async () => {
		mockMagic.user.isLoggedIn.mockResolvedValue(true);

		await act(async () => {
			render(<Navigation />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('account-icon')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText('account-icon'));

		const logoutItem = await screen.findByText('Logout');
		fireEvent.click(logoutItem);

		await waitFor(() => {
			expect(mockMagic.user.logout).toHaveBeenCalled();
		});
	});

	test('navigates to Profile on Profile button click', async () => {
		mockMagic.user.isLoggedIn.mockResolvedValue(true);

		await act(async () => {
			render(<Navigation />);
		});

		await waitFor(() => {
			expect(screen.getByLabelText('account-icon')).toBeInTheDocument();
		});

		fireEvent.click(screen.getByLabelText('account-icon'));

		const profileItem = await screen.findByText('Profile');
		fireEvent.click(profileItem);

		await waitFor(() => {
			expect(mockNavigate).toHaveBeenCalledWith('/profile');
		});
	});
});
