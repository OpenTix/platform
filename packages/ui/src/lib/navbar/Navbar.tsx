import { Container } from '@radix-ui/themes';
import React, { FC } from 'react';
import styled from 'styled-components';

const NavWrapper = styled.nav`
	width: 100%;
	background-color: #fff;
	border-bottom: 1px solid #ddd;
`;

const NavContent = styled.div`
	margin: 0 auto;
	padding: 0 16px;
	display: flex;
	align-items: center;
	height: 60px;
	justify-content: space-between;
`;

export interface NavbarProps {
	children: React.ReactNode;
}

export const Navbar: FC<NavbarProps> = ({ children }) => {
	return (
		<NavWrapper>
			<Container size={'4'}>
				<NavContent>{children}</NavContent>
			</Container>
		</NavWrapper>
	);
};
