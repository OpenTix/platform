import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { Box } from '@radix-ui/themes';
import { NavLink, Navbar } from '@platform/ui';

export default function Navigation() {
	//const { setShowAuthFlow } = useDynamicContext();
	//if we want to change the login button, have a button call this with 'true'
	//to show the modal. this includes dynamic's profile modal post-login

	return (
		<Navbar>
			<Box>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/example1">Example Page 1</NavLink>
			</Box>
			<Box>
				<DynamicWidget />
			</Box>
		</Navbar>
	);
}
