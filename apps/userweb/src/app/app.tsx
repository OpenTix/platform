import styled from 'styled-components';
import NxWelcome from './nx-welcome';
import { VersionTag } from '@platform/ui';

const StyledApp = styled.div`
	// Your style here
`;

export function App() {
	return (
		<StyledApp>
			<NxWelcome title="userweb" />
			<VersionTag />
		</StyledApp>
	);
}

export default App;
