import styled from 'styled-components';

const MobileContainer = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: white;
	color: black;
`;
const MobileMessage = styled.div`
	text-align: center;
	text-color: black;
	max-width: 400px;
	padding: 0 20px;
	h1 {
		font-size: 24px;
		margin-bottom: 10px;
	}
	p {
		font-size: 16px;
	}
`;

export function ViewingOnMobile() {
	return (
		<MobileContainer>
			<MobileMessage>
				<h1>Mobile Not Supported</h1>
				<p>
					This application is not supported on mobile devices. Please
					use a desktop browser to access this application, or use our
					dedicated mobile app.
				</p>
			</MobileMessage>
		</MobileContainer>
	);
}
