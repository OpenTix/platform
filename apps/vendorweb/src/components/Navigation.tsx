import { useMagic } from '@platform/auth';
import { NavButton, NavLink, Navbar } from '@platform/ui';

export default function Navigation() {
	const magic = useMagic();

	return (
		<Navbar>
			<div>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/example1">Example Page 1</NavLink>
			</div>
			<div>
				<NavButton
					variant="outline"
					onClick={() => magic.user.logout()}
				>
					Logout
				</NavButton>
			</div>
		</Navbar>
	);
}
