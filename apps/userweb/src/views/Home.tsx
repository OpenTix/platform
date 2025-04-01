import { AllEventTypesArray } from '@platform/types';
import { Box, Container, Flex } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import EventRow from '../components/EventRow';

export default function Home() {
	const [shouldFetch, setShouldFetch] = useSessionStorage(
		'ShouldFetch',
		true
	);
	const [cards, setCards] = useState<React.ReactNode>(null);

	useEffect(() => {
		setShouldFetch(true);
	}, [setShouldFetch]);

	useEffect(() => {
		async function getEvents() {
			setShouldFetch(false);

			setCards(
				AllEventTypesArray.map((eventType: string, idx: number) => (
					<EventRow
						key={`${idx}:${eventType}`}
						zip={''}
						type={eventType}
						name={''}
						cost={'1000000'}
						eventDate={new Date().toISOString()}
					/>
				))
			);
		}
		getEvents();
	}, [shouldFetch, setShouldFetch]);

	return (
		<Flex align="start" gap="4" style={{ marginTop: '10px' }}>
			<Container style={{ alignSelf: 'center' }} size={'4'}>
				<Box style={{ maxWidth: '90vw', padding: '16px 16px' }}>
					{cards}
				</Box>
			</Container>
		</Flex>
	);
}
