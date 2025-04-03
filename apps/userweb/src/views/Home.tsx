import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { AllEventTypesArray, UserEventResponse } from '@platform/types';
import { Box, Card, Container, Flex, Text } from '@radix-ui/themes';
import { useState, useEffect, useCallback } from 'react';
import { useSessionStorage } from 'usehooks-ts';
import { EventCard } from '../components/EventCard';
import EventRow from '../components/EventRow';

export default function Home() {
	const [shouldFetch, setShouldFetch] = useSessionStorage(
		'ShouldFetch',
		true
	);
	const [zip, setZip] = useSessionStorage('Zip', '');
	const [cards, setCards] = useState<React.ReactNode>(null);
	const [near, setNear] = useState<React.ReactNode[]>([]);
	const [shouldShow, setShouldShow] = useState<boolean>(true);

	const getEvents = useCallback(
		async (postcode: string) => {
			const url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?zip=${postcode}`;

			const resp = await fetch(url, {
				method: 'GET'
			});

			if (!resp.ok) {
				console.error('There was an error fetching data');
				return (
					<Card>
						<Text>There was an error fetching data</Text>
					</Card>
				);
			}

			const data = await resp.json();

			return await (data && data.length !== 0
				? setNear([
						...near,
						data.map((event: UserEventResponse, idx: number) => (
							<EventCard
								key={`${idx}:${event.Name}`}
								event={event}
							/>
						))
					])
				: undefined);
		},
		[setNear, near]
	);

	useEffect(() => {
		setShouldFetch(true);
		navigator?.geolocation?.getCurrentPosition(
			async (position) => {
				const lat = position?.coords?.latitude;
				const lon = position?.coords?.longitude;
				const resp = await fetch(
					`${process.env.NX_PUBLIC_API_BASEURL}/user/zips?Radius=25&Latitude=${lat}&Longitude=${lon}`,
					{
						method: 'GET'
					}
				);
				const json = await resp.json();
				json.postcodes.forEach(async (pc: number) => {
					await getEvents(pc.toString());
					if (near.length >= 5) {
						await setShouldShow(true);
						return;
					}
				});
				// const resp = await fetch(
				// 	`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
				// );
				// const json = await resp?.json();
				// setZip(json?.address?.postcode ?? '');
			},
			(error) => {
				console.error('Geolocation error:', error);
			}
		);
	}, [setShouldFetch, setZip, getEvents, near]);

	useEffect(() => {
		async function showEvents() {
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
							passedData={near}
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
		if (shouldShow) {
			showEvents();
			setShouldShow(false);
		}
	}, [shouldFetch, setShouldFetch, zip, near, shouldShow]);

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
