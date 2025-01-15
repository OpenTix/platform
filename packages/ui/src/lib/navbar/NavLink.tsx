import React, { FC } from 'react';
import { Link, LinkProps } from 'react-router-dom';
import styled from 'styled-components';

const StyledNavLink = styled(Link)`
	color: #333;
	text-decoration: none;
	margin: 0 8px;
	font-size: 16px;

	&:hover {
		text-decoration: underline;
	}
`;

export interface NavLinkProps extends LinkProps {
	children: React.ReactNode;
}

export const NavLink: FC<NavLinkProps> = ({ children, ...props }) => {
	return <StyledNavLink {...props}>{children}</StyledNavLink>;
};
