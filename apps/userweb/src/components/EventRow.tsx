import { UserEventResponse } from '@platform/types';
import { Box, Flex, Heading, Button } from '@radix-ui/themes';
import { useRef } from 'react';
import { EventCard } from './EventCard';

export default function EventRow({ group }: { group: UserEventResponse[] }) {
	const flexRef = useRef(null);

	const moveCards = (dist: number) => {
		if (!flexRef || !flexRef.current) return;
		(flexRef.current as Element).scrollLeft += dist;
	};

	return (
		<Box>
			<Flex gap="1">
				<Heading> {group[0].Type} </Heading>
				<Button
					onClick={() => moveCards(-1000)}
					style={{
						backgroundColor: 'rgba(0,0,0,0)',
						color: 'darkgray'
					}}
				>
					{' <'}
				</Button>
				<Button
					onClick={() => moveCards(1000)}
					style={{
						backgroundColor: 'rgba(0,0,0,0)',
						color: 'darkgrey'
					}}
				>
					{'> '}
				</Button>
			</Flex>
			<Flex width="100%">
				<Flex
					gap="3"
					direction="row"
					overflowX="hidden"
					style={{ scrollBehavior: 'smooth' }}
					ref={flexRef}
				>
					{group.map((event: UserEventResponse, jdx: number) => (
						<EventCard
							key={`Card_${group[0].Type}_${jdx}`}
							event={event}
						/>
					))}
				</Flex>
			</Flex>
		</Box>
	);
}
