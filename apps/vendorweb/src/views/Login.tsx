import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useMagic } from '@platform/auth';
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

const RightContent = styled.div`
	padding-bottom: 2.5rem;
`;

const RightFooter = styled.footer`
	position: absolute;
	bottom: 0;
	right: 0;
	padding: 0.5rem;
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

const Button = styled.button`
	padding: 0.75rem;
	font-size: 1rem;
	cursor: pointer;
`;

function Login() {
	const magic = useMagic();
	const [email, setEmail] = useState('');
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await magic.auth.loginWithMagicLink({ email });
			navigate(0);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	return (
		<Container>
			<LeftSection>Vendorweb Login</LeftSection>

			<RightSection>
				<RightContent>
					<Form onSubmit={handleSubmit}>
						<Input
							type="email"
							placeholder="Email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
						<Button type="submit">Login</Button>
					</Form>
				</RightContent>

				<RightFooter>
					<VersionTag />
				</RightFooter>
			</RightSection>
		</Container>
	);
}

export default Login;
