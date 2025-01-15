import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import React from 'react';
import { useRouteError } from 'react-router-dom';
import { ErrorPage } from './ErrorPage';

// Mock the useRouteError hook
jest.mock('react-router-dom', () => ({
	useRouteError: jest.fn()
}));

describe('ErrorPage', () => {
	it('renders with an unexpected error message', () => {
		(useRouteError as jest.Mock).mockReturnValue({
			statusText: 'Not Found',
			message: 'Page not found'
		});

		const { getByText } = render(<ErrorPage />);
		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, an unexpected error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Not Found')).toBeInTheDocument();
	});

	it('renders a generic error if no statusText', () => {
		(useRouteError as jest.Mock).mockReturnValue({
			message: 'Something went wrong'
		});

		const { getByText } = render(<ErrorPage />);
		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, an unexpected error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Something went wrong')).toBeInTheDocument();
	});

	it('renders a fatal error message when fatal is true', () => {
		(useRouteError as jest.Mock).mockReturnValue({
			message: 'Fatal error'
		});

		const { getByText } = render(<ErrorPage fatal />);
		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, a fatal error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Fatal error')).toBeInTheDocument();
	});

	it('renders a 404 message when is404 is true', () => {
		(useRouteError as jest.Mock).mockReturnValue(null);

		const { getByText } = render(<ErrorPage is404 />);
		expect(getByText('Yikes!')).toBeInTheDocument();
		expect(
			getByText('Sorry, an unexpected error has occurred.')
		).toBeInTheDocument();
		expect(getByText('Page not found')).toBeInTheDocument();
	});
});
