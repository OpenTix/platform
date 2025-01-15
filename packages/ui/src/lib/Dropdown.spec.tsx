import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Dropdown, DropdownProps } from './Dropdown';

// Helper component to render the Dropdown with required props
const renderDropdown = (props: Partial<DropdownProps> = {}) => {
	const defaultProps: DropdownProps = {
		trigger: <button data-testid="trigger-button">Open Dropdown</button>,
		items: [
			{ label: 'Item 1', onClick: jest.fn() },
			{ label: 'Item 2', onClick: jest.fn(), disabled: true }
		]
	};

	return render(<Dropdown {...defaultProps} {...props} />);
};

describe('Dropdown', () => {
	it('renders the trigger', () => {
		renderDropdown();
		expect(screen.getByTestId('trigger-button')).toBeInTheDocument();
	});

	it('does not show the menu by default', () => {
		renderDropdown();
		expect(screen.queryByRole('menu')).not.toBeInTheDocument();
	});

	it('opens the menu when trigger is clicked', () => {
		renderDropdown();

		const trigger = screen.getByTestId('trigger-button');
		fireEvent.click(trigger);

		// We might not have role="menu" by default, so we’ll look for text or use a test id
		// For simplicity, check if items are on screen:
		expect(screen.getByText('Item 1')).toBeInTheDocument();
		expect(screen.getByText('Item 2')).toBeInTheDocument();
	});

	it('closes the menu when clicking outside', () => {
		renderDropdown();

		const trigger = screen.getByTestId('trigger-button');
		fireEvent.click(trigger);
		expect(screen.getByText('Item 1')).toBeInTheDocument();

		// Click outside — e.g., on the document body
		fireEvent.mouseDown(document.body);

		// The dropdown should close
		expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
	});

	it('calls onClick when clicking an enabled item', () => {
		const onClickMock = jest.fn();
		const items = [
			{ label: 'Item 1', onClick: onClickMock },
			{ label: 'Item 2', disabled: true }
		];

		renderDropdown({ items });

		// Open the dropdown
		fireEvent.click(screen.getByTestId('trigger-button'));

		// Click the first item (enabled)
		fireEvent.click(screen.getByText('Item 1'));

		expect(onClickMock).toHaveBeenCalledTimes(1);
	});

	it('does not call onClick when clicking a disabled item', () => {
		const onClickMock = jest.fn();
		const items = [
			{ label: 'Item 1', onClick: onClickMock },
			{ label: 'Item 2', onClick: onClickMock, disabled: true }
		];

		renderDropdown({ items });

		// Open the dropdown
		fireEvent.click(screen.getByTestId('trigger-button'));

		// Click the disabled item
		fireEvent.click(screen.getByText('Item 2'));

		expect(onClickMock).toHaveBeenCalledTimes(0);
	});

	it('closes the dropdown after clicking an enabled item', () => {
		renderDropdown();

		// Open the dropdown
		fireEvent.click(screen.getByTestId('trigger-button'));
		expect(screen.getByText('Item 1')).toBeInTheDocument();

		// Click the first item
		fireEvent.click(screen.getByText('Item 1'));

		// The dropdown should close
		expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
	});

	/**
	 * The following tests demonstrate a simplified approach to checking
	 * if `dropUp` and `alignRight` might be set. In reality, testing
	 * the actual DOM position can be tricky without mocking
	 * measurements. Often these are tested via integration/visual tests.
	 */
	it('renders dropdown below by default (dropUp=false)', () => {
		renderDropdown();
		fireEvent.click(screen.getByTestId('trigger-button'));

		// In a real test, you might check the style or class
		// or mock the boundingClientRect calculations.
		const dropdownMenu = screen.getByText('Item 1').closest('div');
		expect(dropdownMenu).toHaveStyle('top: 100%'); // This is from your styled-components
	});

	it('renders dropdown aligned to the left by default (alignRight=false)', () => {
		renderDropdown();
		fireEvent.click(screen.getByTestId('trigger-button'));

		const dropdownMenu = screen.getByText('Item 1').closest('div');
		expect(dropdownMenu).toHaveStyle('left: 0');
	});

	// Additional tests for edge cases can be added here.
});
