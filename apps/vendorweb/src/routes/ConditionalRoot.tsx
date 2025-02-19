import { getAuthToken, useIsLoggedIn } from '@dynamic-labs/sdk-react-core';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import { MoonLoader } from 'react-spinners';
import styled, { css } from 'styled-components';
import Login from '../views/Login';
import AppLayout from './AppLayout';

const PageContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
`;
const AppContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: flex-start; /* Left-align items */
	max-width: 600px; /* Optional: limit the width of the content */
	padding: 1rem;
`;
const AppContainerCentered = styled(AppContainer)`
	align-items: center;
`;
const Header = styled.h1`
	font-size: 2rem;
	margin-bottom: 1rem;
`;
const TextBlock = styled.p`
	font-size: 1.25rem;
	margin-bottom: 1rem;
`;
const TextBlockFadeIn = styled(TextBlock)`
	opacity: 0;
	animation: fadeIn 1s forwards;
	@keyframes fadeIn {
		to {
			opacity: 1;
		}
	}
`;
const Form = styled.form`
	display: flex;
	flex-direction: column;
	width: 300px;
`;
const Input = styled.input`
	margin-bottom: 1rem;
	padding: 0.75rem;
	font-size: 1rem;
`;
const ButtonContainer = styled.div`
	display: flex;
	flex-direction: row;
`;
type ButtonProps = {
	variant: 'filled' | 'outline';
};
const Button = styled.button<ButtonProps>`
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

function ConditionalRoot() {
	const isLoggedIn = useIsLoggedIn();
	const { handleLogOut } = useDynamicContext();
	const [isVendor, setIsVendor] = useState<boolean | null>(null);
	const [organizationName, setOrganizationName] = useState<string>('');
	const [isLoadingText2Readable, setIsLoadingText2Readable] =
		useState<boolean>(false);
	const vendorIdEndpoint = process.env.NX_PUBLIC_API_BASEURL + '/vendor/id';

	const checkIfVendorExists = async () => {
		try {
			const authToken = getAuthToken();
			const response = await fetch(vendorIdEndpoint, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${authToken}`
				}
			});
			return response.status === 200;
		} catch (error) {
			console.error('CheckVendorExists: ' + error);
			return false;
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const authToken = getAuthToken();
			const response = await fetch(vendorIdEndpoint, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${authToken}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ name: organizationName })
			});
			if (response.status === 201) {
				setIsVendor(true);
			}
		} catch (error) {
			console.error(error);
			alert('Failed to enroll as a vendor: ' + error);
		}
	};

	useEffect(() => {
		if (isLoggedIn) {
			checkIfVendorExists().then((result) => {
				setIsVendor(result);
			});
		}
		const timer = setTimeout(() => {
			setIsLoadingText2Readable(true);
		}, 5000);
		return () => clearTimeout(timer);
	}, [isLoggedIn]);

	if (isLoggedIn && isVendor === null) {
		return (
			<PageContainer>
				<AppContainerCentered>
					<MoonLoader color="#ff8200" />
					<TextBlock>Loading...</TextBlock>
					{isLoadingText2Readable && (
						<TextBlockFadeIn>... a lot of things.</TextBlockFadeIn>
					)}
				</AppContainerCentered>
			</PageContainer>
		);
	}

	if (!isLoggedIn) {
		return <Login />;
	}

	if (isVendor) {
		return <AppLayout />;
	}

	return (
		<PageContainer>
			<AppContainer>
				<Header>Vendor User Interface</Header>
				<TextBlock>
					You are not a vendor. To become one, enter the name of your
					organization in the input below and click enroll. Otherwise,
					sign out.
				</TextBlock>
				<Form onSubmit={handleSubmit}>
					<Input
						type="text"
						placeholder="Organization Name"
						value={organizationName}
						onChange={(e) => setOrganizationName(e.target.value)}
					/>
					<ButtonContainer>
						<Button variant="filled" type="submit">
							Enroll
						</Button>
						<Button
							variant="outline"
							onClick={() => handleLogOut()}
						>
							Sign Out
						</Button>
					</ButtonContainer>
				</Form>
			</AppContainer>
		</PageContainer>
	);
}

export default ConditionalRoot;
