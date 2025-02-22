import { DynamicEmbeddedAuthFlow } from '@dynamic-labs/sdk-react-core';
import styled from 'styled-components';
import { VersionTag } from '@platform/ui';

const Container = styled.div`
	display: flex;
	height: 100vh;
	width: 100%;
	position: relative;
	min-height: 100vh;
`;

const LeftSection = styled.div`
	flex: 1;
	background: linear-gradient(
		135deg,
		rgb(242, 157, 114) 0%,
		rgb(229, 81, 81) 100%
	);
	display: flex;
	justify-content: center;
	align-items: center;
	color: #fff;
	font-size: 2rem;
	text-align: center;
`;

const RightSection = styled.div`
	flex: 1;
	position: relative;
	display: flex;
	justify-content: center;
	align-items: center;
`;

const RightFooter = styled.footer`
	position: absolute;
	bottom: 0;
	right: 0;
	padding: 0.5rem;
`;

function Login() {
	return (
		<Container>
			<LeftSection>Vendorweb Login</LeftSection>

			<RightSection>
				<DynamicEmbeddedAuthFlow background="with-border" />

				<RightFooter>
					<VersionTag />
				</RightFooter>
			</RightSection>
		</Container>
	);
}

export default Login;
