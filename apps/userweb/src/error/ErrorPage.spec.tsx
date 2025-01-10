import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouteError } from 'react-router-dom';
import ErrorPage from './ErrorPage';

// Mock the useRouteError hook
jest.mock('react-router-dom', () => ({
	useRouteError: jest.fn(),
}));

describe('ErrorPage', () => {
	it('renders the error page with the error message', () => {
		const mockError = {
			statusText: 'Not Found',
			message: 'Page not found',
		};
		(useRouteError as jest.Mock).mockReturnValue(mockError);

		const { getByText } = render(<ErrorPage />);

		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, an unexpected error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Not Found')).toBeInTheDocument();
	});

	it('renders the error page with a generic error message if no statusText', () => {
		const mockError = { message: 'Something went wrong' };
		(useRouteError as jest.Mock).mockReturnValue(mockError);

		const { getByText } = render(<ErrorPage />);

		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, an unexpected error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Something went wrong')).toBeInTheDocument();
	});
});
