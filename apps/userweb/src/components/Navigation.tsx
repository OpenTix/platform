import { Navbar, NavLink, NavButton } from '@platform/ui';
import { useMagic } from '../auth/magic';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Dropdown } from '@platform/ui';
import { AccountCircle } from '@mui/icons-material';
import { ClipLoader } from 'react-spinners';

export default function Navigation() {
	const magic = useMagic();
	const navigate = useNavigate();
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	const handleLogin = async () => {
		setIsLoading(true);
		try {
			await magic.wallet.connectWithUI();
			navigate(0);
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	useEffect(() => {
		setIsLoading(true);
		magic.user
			.isLoggedIn()
			.then((magicIsLoggedIn) => {
				setIsLoggedIn(magicIsLoggedIn);
			})
			.catch((error) => {
				console.error(error);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	return (
		<Navbar>
			<div>
				<NavLink to="/">Home</NavLink>
			</div>
			<div>
				{isLoading ? (
					<NavButton variant="filled" disabled>
						<ClipLoader color="#fff" size={20} />
					</NavButton>
				) : isLoggedIn ? (
					<Dropdown
						trigger={<AccountCircle />}
						items={[
							{
								label: 'Profile',
								onClick: () => navigate('/profile'),
							},
							{
								label: 'Logout',
								onClick: async () => {
									await magic.user.logout();
									setIsLoggedIn(false);
								},
							},
						]}
					/>
				) : (
					<NavButton variant="filled" onClick={handleLogin}>
						Login
					</NavButton>
				)}
			</div>
		</Navbar>
	);
}
