import { Text } from '@radix-ui/themes';
import styled, { keyframes } from 'styled-components';

const LoadingOverlay = styled.div`
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	background-color: rgba(0, 0, 0, 0.5); /* Grayed-out background */
	display: flex;
	justify-content: center;
	align-items: center;
	z-index: 1000; /* Ensure it's on top */
`;

const LoadingPopup = styled.div`
	background-color: white;
	padding: 20px;
	border-radius: 8px;
	text-align: center;
`;

const spin = keyframes`
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
`;

const Loader = styled.div`
	border: 4px solid #f3f3f3; /* Light grey */
	border-top: 4px solid #3498db; /* Blue */
	border-radius: 50%;
	width: 30px;
	height: 30px;
	animation: ${spin} 2s linear infinite;
	margin: 0 auto 10px;
`;

export interface FullscreenLoadingMessageProps {
	message: string;
}
export const FullscreenLoadingMessage = ({
	message
}: FullscreenLoadingMessageProps) => {
	return (
		<LoadingOverlay>
			<LoadingPopup>
				<Loader />
				<Text as="p" style={{ color: '#000' }}>
					{message}
				</Text>
			</LoadingPopup>
		</LoadingOverlay>
	);
};
