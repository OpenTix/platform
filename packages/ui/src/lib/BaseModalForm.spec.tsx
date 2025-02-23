import '@testing-library/jest-dom';
import { render, fireEvent, screen } from '@testing-library/react';
import { BaseModalForm } from './BaseModalForm';

describe('BaseModalForm', () => {
	const onSubmitMock = jest.fn();
	const onCloseMock = jest.fn();
	const titleText = 'Test Modal Title';
	const errorText = 'Test error message';
	const childContent = <div data-testid="child">Child content here</div>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders the modal with title and children content', () => {
		render(
			<BaseModalForm
				title={titleText}
				isSubmitting={false}
				onSubmit={onSubmitMock}
				onClose={onCloseMock}
			>
				{childContent}
			</BaseModalForm>
		);

		expect(screen.getByText(titleText)).toBeInTheDocument();
		expect(screen.getByTestId('child')).toBeInTheDocument();
	});

	it('calls onSubmit when the Add button is clicked', () => {
		render(
			<BaseModalForm
				title={titleText}
				isSubmitting={false}
				onSubmit={onSubmitMock}
				onClose={onCloseMock}
			>
				{childContent}
			</BaseModalForm>
		);

		const addButton = screen.getByRole('button', { name: /add/i });
		fireEvent.click(addButton);
		expect(onSubmitMock).toHaveBeenCalledTimes(1);
	});

	it('calls onClose when the Cancel button is clicked', () => {
		render(
			<BaseModalForm
				title={titleText}
				isSubmitting={false}
				onSubmit={onSubmitMock}
				onClose={onCloseMock}
			>
				{childContent}
			</BaseModalForm>
		);

		const cancelButton = screen.getByRole('button', { name: /cancel/i });
		fireEvent.click(cancelButton);
		expect(onCloseMock).toHaveBeenCalledTimes(1);
	});

	it('displays an error message when showError is true', () => {
		render(
			<BaseModalForm
				title={titleText}
				isSubmitting={false}
				errorMessage={errorText}
				showError={true}
				onSubmit={onSubmitMock}
				onClose={onCloseMock}
			>
				{childContent}
			</BaseModalForm>
		);

		expect(screen.getByText(errorText)).toBeInTheDocument();
	});
});
