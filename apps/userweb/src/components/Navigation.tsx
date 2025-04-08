import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Box } from '@radix-ui/themes';
import { TextField, Button } from '@radix-ui/themes';
import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSessionStorage } from 'usehooks-ts';
import { NavLink, Navbar } from '@platform/ui';

export default function Navigation() {
	//const { setShowAuthFlow } = useDynamicContext();
	//if we want to change the login button, have a button call this with 'true'
	//to show the modal. this includes dynamic's profile modal post-login
	const [params] = useSearchParams();

	const [search, setSearch] = useState(params.get('Name') ?? '');

	const [, setDataChanged] = useSessionStorage('DataChanged', true);
	const [, setShouldFetch] = useSessionStorage('ShouldFetch', true);
	const location = useLocation();
	const navigate = useNavigate();

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setDataChanged(true);
		setShouldFetch(true);
		navigate(
			`/eventSearch?Name=${search}${params.get('Page') ? `&Page=${params.get('Page')}` : ''}${params.get('Zip') ? `&Zip=${params.get('Zip')}` : ''}${params.get('Type') ? `&Type=${params.get('Type')}` : ''}${params.get('Cost') ? `&Cost=${params.get('Cost')}` : ''}${params.get('Date') ? `&Date=${params.get('Date')}` : ''}`
		);
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
					<form
						onSubmit={handleSearch}
						style={{
							display: 'flex',
							gap: '0px',
							overflow: 'hidden'
						}}
					>
						<Button
							type="submit"
							size="3"
							variant="surface"
							color="gray"
							style={{
								borderTopRightRadius: '0',
								borderBottomRightRadius: '0'
							}}
						>
							<MagnifyingGlassIcon width="20" height="20" />
						</Button>
						<TextField.Root
							placeholder="Search"
							size="3"
							name="Name"
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setDataChanged(true);
							}}
							style={{
								flex: '1',
								borderTopLeftRadius: '0',
								borderBottomLeftRadius: '0'
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
