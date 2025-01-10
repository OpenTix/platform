import styled, { css } from 'styled-components';
import React, { ButtonHTMLAttributes, FC } from 'react';

const StyledButton = styled.button<NavButtonProps>`
	margin: 0 8px 0 0;
	padding: 8px 16px;
	font-size: 16px;
	cursor: pointer;
	border-radius: 4px;
	transition: background-color 0.2s ease;
	border: 2px solid #007bff;

	${({ variant }) =>
		variant === 'filled'
			? css`
					background-color: #007bff;
					color: #ffffff;
					&:hover {
						background-color: #0056b3;
					}
			  `
			: css`
					background-color: transparent;
					color: #007bff;
					&:hover {
						background-color: rgba(0, 123, 255, 0.1);
					}
			  `}
`;

export interface NavButtonProps
	extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: 'filled' | 'outline';
	children: React.ReactNode;
}

export const NavButton: FC<NavButtonProps> = ({
	variant = 'filled',
	children,
	...props
}) => {
	return (
		<StyledButton variant={variant} {...props}>
			{children}
		</StyledButton>
	);
};
