import React, {
	useState,
	useRef,
	useEffect,
	ReactNode,
	MouseEventHandler,
} from 'react';

import styled, { css } from 'styled-components';

const DropdownContainer = styled.div`
	position: relative;
	display: inline-block;
`;

const DropdownTriggerWrapper = styled.div`
	cursor: pointer;
`;

// Add both dropUp and alignRight to the menu props
const DropdownMenu = styled.div<{ dropUp?: boolean; alignRight?: boolean }>`
	position: absolute;
	min-width: 160px;
	background: #fff;
	border: 1px solid #ccc;
	border-radius: 4px;
	margin-top: 4px;
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	z-index: 9999;

	/* Vertical alignment */
	${({ dropUp }) =>
		dropUp
			? css`
					bottom: 100%;
					margin-bottom: 4px;
			  `
			: css`
					top: 100%;
			  `}

	/* Horizontal alignment */
	${({ alignRight }) =>
		alignRight
			? css`
					right: 0;
			  `
			: css`
					left: 0;
			  `}
`;

const DropdownItem = styled.button`
	width: 100%;
	padding: 8px 12px;
	background: transparent;
	border: none;
	text-align: left;
	font-size: 14px;
	cursor: pointer;
	color: #333;

	&:hover {
		background: #f5f5f5;
	}

	&:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}
`;

export interface DropdownItemProps {
	label: string;
	onClick?: MouseEventHandler<HTMLButtonElement>;
	disabled?: boolean;
}

export interface DropdownProps {
	/** The node (e.g. button/icon) that toggles this dropdown. */
	trigger: ReactNode;
	/** Array of items to display in the dropdown menu. */
	items?: DropdownItemProps[];
	/** Additional className for the container */
	className?: string;
}

/**
 * A Dropdown component that positions itself above/below and left/right
 * of the trigger so as not to overflow the window.
 */
export const Dropdown: React.FC<DropdownProps> = ({
	trigger,
	items = [],
	className,
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const [dropUp, setDropUp] = useState(false);
	const [alignRight, setAlignRight] = useState(false);

	const menuRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLDivElement>(null);

	// Toggles the dropdown
	const handleToggle = () => {
		setIsOpen((prev) => !prev);
	};

	// Close on outside click
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			// If neither the menu nor trigger contains the click, close
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	// Auto-position the menu above/below and left/right
	useEffect(() => {
		if (!isOpen) return;

		const menuEl = menuRef.current;
		const triggerEl = triggerRef.current;
		if (!menuEl || !triggerEl) return;

		const { bottom, right } = triggerEl.getBoundingClientRect();
		const menuHeight = menuEl.offsetHeight;
		const menuWidth = menuEl.offsetWidth;
		const windowHeight = window.innerHeight;
		const windowWidth = window.innerWidth;

		// If there is not enough space below, open above
		if (bottom + menuHeight > windowHeight) {
			setDropUp(true);
		} else {
			setDropUp(false);
		}

		// If there is not enough space to the right, align to the left
		if (right + menuWidth > windowWidth) {
			setAlignRight(true);
		} else {
			setAlignRight(false);
		}
	}, [isOpen]);

	return (
		<DropdownContainer className={className}>
			<DropdownTriggerWrapper ref={triggerRef} onClick={handleToggle}>
				{trigger}
			</DropdownTriggerWrapper>

			{isOpen && (
				<DropdownMenu
					ref={menuRef}
					dropUp={dropUp}
					alignRight={alignRight}
				>
					{items.map(({ label, onClick, disabled }, index) => (
						<DropdownItem
							key={index}
							onClick={(e) => {
								if (onClick) onClick(e);
								setIsOpen(false);
							}}
							disabled={disabled}
						>
							{label}
						</DropdownItem>
					))}
				</DropdownMenu>
			)}
		</DropdownContainer>
	);
};
