import { AllEventTypesArray } from '@platform/types';
import { Box, Flex } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import EventRow from '../components/EventRow';

export default function Home() {
	const [cards, setCards] = useState<React.ReactNode>(null);
	const [nearZips, setNearZips] = useState<string>('');
	const [shouldShow, setShouldShow] = useState<boolean>(true);

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
				let zips = '';
				json?.postcodes?.forEach((pc: number) => {
					zips += pc.toString() + ', ';
				});
				zips = zips.slice(0, -1);
				if (zips.length > 3) setNearZips(zips);
			},
			(error) => {
				console.error('Geolocation error:', error);
			}
		);
	}, []);

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
	}, [shouldShow, setShouldShow, nearZips]);

	return (
		<Flex
			align="start"
			gap="4"
			style={{ marginTop: '10px' }}
			justify={'center'}
		>
			<Box style={{ width: '72vw' }}>
				{nearZips !== '' ? (
					<EventRow
						key={'Near You'}
						zip={nearZips}
						type={'Near You'}
						name={''}
						cost={'1000000'}
						eventDate={new Date().toISOString()}
					/>
				) : null}
				{cards}
			</Box>
		</Flex>
	);
}
