import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventResponse } from '@platform/types';
import { Box, Flex, Heading, Button, Card, Text } from '@radix-ui/themes';
import { useEffect, useState, useRef, memo } from 'react';
import { EventCard } from './EventCard';

interface rowProps {
	zip: string;
	type: string;
	name: string;
	cost: string;
	eventDate: string;
}

function EventRow({ zip, type, name, cost, eventDate }: rowProps) {
	const flexRef = useRef(null);
	const [cards, setCards] = useState<React.ReactNode>(null);
	const [page, setPage] = useState(1);

	const moveCards = (dist: number, pageDist: number) => {
		if (!flexRef || !flexRef.current) return;
		(flexRef.current as Element).scrollLeft += dist;
		setPage(page + pageDist < 1 ? page : page + pageDist);
	};

	useEffect(() => {
		Promise.resolve(
			getEvents(
				`Page=${page}&Zip=${zip}&Type=${type === 'Near You' ? '' : type}&Name=${''}&Basecost=${cost}&EventDatetime=${eventDate}`
			)
		)
			.then((resp) => {
				if (resp !== undefined) {
					setCards(resp);
				} else if (page <= 1) {
					setPage(page);
				} else {
					setPage(page - 1);
				}
			})
			.catch((error) => console.error('EventRow: ', error));
	}, [page, zip, type, name, cost, eventDate]);

	if (cards === null) return null;
	return (
		<Box my="6">
			<Flex mb="2" justify={'between'}>
				<Heading> {type} </Heading>
				<Flex gap="1">
					<Button
						onClick={() => moveCards(0, -1)}
						style={{
							backgroundColor: 'rgba(0,0,0,0)',
							color: 'darkgray',
							fontWeight: 'bold',
							cursor: 'pointer'
						}}
					>
						{' <'}
					</Button>
					<Button
						onClick={() => moveCards(0, 1)}
						style={{
							backgroundColor: 'rgba(0,0,0,0)',
							color: 'darkgrey',
							fontWeight: 'bold',
							cursor: 'pointer'
						}}
					>
						{'> '}
					</Button>
				</Flex>
			</Flex>
			<Flex width="100%">
				<Flex
					gap="3"
					direction="row"
					overflowX="hidden"
					style={{ scrollBehavior: 'smooth' }}
					ref={flexRef}
				>
					{cards}
				</Flex>
			</Flex>
		</Box>
	);
}

async function getEvents(pageRequest: string) {
	const url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?${pageRequest}`;

	const authToken = getAuthToken();
	const resp = await fetch(url, {
		method: 'GET',
		headers: { Authorization: `Bearer ${authToken}` }
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
		? data.map((event: UserEventResponse, idx: number) => (
				<EventCard key={`${idx}:${event.Name}`} event={event} />
			))
		: undefined);
}

export default memo(EventRow);
