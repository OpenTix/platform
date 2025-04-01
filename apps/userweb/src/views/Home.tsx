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
	const [zip, setZip] = useSessionStorage('Zip', '');
	const [cards, setCards] = useState<React.ReactNode>(null);

	useEffect(() => {
		setShouldFetch(true);
		navigator?.geolocation?.getCurrentPosition(async (position) => {
			const lat = position?.coords?.latitude;
			const lon = position?.coords?.longitude;
			const resp = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
			);
			const json = await resp?.json();
			setZip(json?.address?.postcode ?? '');
		});
	}, [setShouldFetch, setZip]);

	useEffect(() => {
		async function getEvents() {
			setShouldFetch(false);

			setCards(
				<>
					{zip !== '' ? (
						<EventRow
							key={'Near You'}
							zip={zip}
							type={'Near You'}
							name={''}
							cost={'1000000'}
							eventDate={new Date().toISOString()}
						/>
					) : null}
					{AllEventTypesArray.map(
						(eventType: string, idx: number) => (
							<EventRow
								key={`${idx}:${eventType}`}
								zip={''}
								type={eventType}
								name={''}
								cost={'1000000'}
								eventDate={new Date().toISOString()}
							/>
						)
					)}
				</>
			);
		}
		getEvents();
	}, [shouldFetch, setShouldFetch, zip]);

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
