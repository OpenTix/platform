import styled from 'styled-components';
import NxWelcome from './nx-welcome';
import { Ui } from '@platform/ui';

const StyledApp = styled.div`
	// Your style here
`;

export function App() {
	return (
		<StyledApp>
			<NxWelcome title="userweb" />
			<Ui />
		</StyledApp>
	);
}

export default App;
