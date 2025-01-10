import { Navbar, NavLink, NavButton } from '@platform/ui';
import { useMagic } from '../auth/magic';
import { useNavigate } from 'react-router-dom';

export default function Navigation() {
	const magic = useMagic();
	const navigate = useNavigate();

	const handleLogin = async () => {
		try {
			await magic.wallet.connectWithUI();
			navigate(0);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Navbar>
			<div>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/profile">Profile</NavLink>
			</div>
			<div>
				<NavButton variant="outline" onClick={handleLogin}>
					Login
				</NavButton>
				<NavButton variant="filled" onClick={() => magic.user.logout()}>
					Logout
				</NavButton>
			</div>
		</Navbar>
	);
}
