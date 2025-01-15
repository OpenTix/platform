import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import { VersionTag } from '@platform/ui';
import Navigation from './components/Navigation';

// Styles to keep footer at the bottom of the page.
const PageContainer = styled.div`
	position: relative;
	min-height: 100vh;
`;

const ContentContainer = styled.div`
	padding-bottom: 2.5rem;
`;

const FooterContainer = styled.footer`
	position: absolute;
	height: 2.5rem;
	bottom: 0;
	width: 100%;
`;

// This allows us to render the navbar on every page of our app.
// it also gives a place to render all providers after the routerprovider
export default function App() {
	return (
		<PageContainer>
			<ContentContainer>
				<Navigation />
				<Outlet />
			</ContentContainer>

			<FooterContainer>
				<VersionTag />
			</FooterContainer>
		</PageContainer>
	);
}
