import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { Box } from '@radix-ui/themes';
import { TextField } from '@radix-ui/themes';
import { useLocation } from 'react-router-dom';
import { useSessionStorage } from 'usehooks-ts';
import { NavLink, Navbar } from '@platform/ui';

export default function Navigation() {
	//const { setShowAuthFlow } = useDynamicContext();
	//if we want to change the login button, have a button call this with 'true'
	//to show the modal. this includes dynamic's profile modal post-login

	const [ename, setEname] = useSessionStorage('Name', '');
	const [, setDataChanged] = useSessionStorage('DataChanged', true);
	const [, setShouldFetch] = useSessionStorage('ShouldFetch', true);
	const location = useLocation();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setEname(ename);
		setDataChanged(true);
		setShouldFetch(true);
	};

	return (
		<Navbar>
			<Box>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/profile">Profile</NavLink>
			</Box>
			{location.pathname === '/' && (
				<Box>
					<form onSubmit={handleSearch}>
						<TextField.Root
							placeholder="Search"
							size="3"
							name="Name"
							value={ename}
							onChange={(e) => {
								setEname(e.target.value);
								setDataChanged(true);
							}}
						/>
					</form>
				</Box>
			)}
			<Box>
				<DynamicWidget />
			</Box>
		</Navbar>
	);
}
