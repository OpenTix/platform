import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { Box } from '@radix-ui/themes';
import { TextField } from '@radix-ui/themes';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionStorage } from 'usehooks-ts';
import { NavLink, Navbar } from '@platform/ui';

export default function Navigation() {
	//const { setShowAuthFlow } = useDynamicContext();
	//if we want to change the login button, have a button call this with 'true'
	//to show the modal. this includes dynamic's profile modal post-login

	const [search, setSearch] = useState('');

	const [ename, setEname] = useSessionStorage('Name', '');
	const [, setDataChanged] = useSessionStorage('DataChanged', true);
	const [, setShouldFetch] = useSessionStorage('ShouldFetch', true);
	const [searchParams, setSearchParams] = useSearchParams();
	const location = useLocation();
	const navigate = useNavigate();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setEname(search);
		setDataChanged(true);
		setShouldFetch(true);
		navigate(`/eventSearch`);
	};

	return (
		<Navbar>
			<Box>
				<NavLink to="/">Home</NavLink>
				<NavLink to="/profile">Profile</NavLink>
			</Box>
			{(location.pathname === '/' ||
				location.pathname === '/eventSearch') && (
				<Box>
					<form onSubmit={handleSearch}>
						<TextField.Root
							placeholder="Search"
							size="3"
							name="Name"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
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
