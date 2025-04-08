import { AllEventTypesArray, UserEventResponse } from '@platform/types';
import { Box, Card, Flex, Text } from '@radix-ui/themes';
import { useState, useEffect, useCallback, useRef } from 'react';
import { EventCard } from '../components/EventCard';
import EventRow from '../components/EventRow';

export default function Home() {
	const [cards, setCards] = useState<React.ReactNode>(null);
	const near = useRef<React.ReactNode[]>([]);
	const [shouldShow, setShouldShow] = useState<boolean>(true);
	const [nearReady, setNearReady] = useState<boolean>(false);

	const getEvents = useCallback(async (postcode: string) => {
		const url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?zip=${postcode}&EventDatetime=${new Date().toISOString()}`;

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
			? (near.current = [
					...near.current,
					data.map((event: UserEventResponse, idx: number) => (
						<EventCard key={`${idx}:${event.Name}`} event={event} />
					))
				])
			: undefined);
	}, []);

	useEffect(() => {
		navigator?.geolocation?.getCurrentPosition(
			async (position) => {
				const lat = position?.coords?.latitude;
				const lon = position?.coords?.longitude;
				const resp = await fetch(
					`${process.env.NX_PUBLIC_API_BASEURL}/user/zips?Radius=50&Latitude=${lat}&Longitude=${lon}`,
					{
						method: 'GET',
						referrer: 'https://client.dev.opentix.co'
					}
				);
				const json = await resp.json();
				json?.postcodes?.forEach(async (pc: number) => {
					await getEvents(pc.toString());
					if (near.current.length >= 5) {
						setTimeout(() => setNearReady(true), 750);
						return;
					}
				});
				setTimeout(() => setNearReady(true), 750);
			},
			(error) => {
				console.error('Geolocation error:', error);
			}
		);
	}, [getEvents]);

	useEffect(() => {
		async function showEvents() {
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
		if (shouldShow) {
			setShouldShow(false);
			showEvents();
		}
	}, [shouldShow, setShouldShow, nearReady]);

	return (
		<Flex
			align="start"
			gap="4"
			style={{ marginTop: '10px' }}
			justify={'center'}
		>
			<Box style={{ width: '72vw' }}>
				{nearReady && near.current.length > 0 ? (
					<EventRow
						key={'Near You'}
						zip={''}
						type={'Near You'}
						name={''}
						cost={'1000000'}
						eventDate={new Date().toISOString()}
						passedData={near.current}
					/>
				) : null}
				{cards}
			</Box>
		</Flex>
	);
}
