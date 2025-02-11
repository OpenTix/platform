import styled from 'styled-components';

const StyledTypes = styled.div`
	color: pink;
`;
export function Types() {
	return (
		<StyledTypes>
			<h1>Welcome to Types!</h1>
		</StyledTypes>
	);
}

export type EventData = {
	id: string;
	date: number;
	name: string;
}

export type VenueData = {
	id: string;
	date: number;
	location: string;
}

export default Types;
