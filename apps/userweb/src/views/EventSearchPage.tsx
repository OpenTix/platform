import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { AllEventTypesArray, UserEventResponse } from '@platform/types';
import {
	Text,
	Card,
	Box,
	Button,
	Flex,
	Select,
	TextField
} from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useSessionStorage } from 'usehooks-ts';
import { EventCard } from '../components/EventCard';

const PopoverLabel = styled.label`
	display: flex;
	flex-direction: row;
	column-gap: 10px;
	width: 250px;
	justify-content: space-between;
`;

function getTimestamp() {
	return new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
		.toISOString()
		.slice(0, 16);
}

export default function EventSearchPage() {
	const [searchParams, setSearchParams] = useSearchParams();
	const [showSidebar, setShowSidebar] = useState(false);
	const [page, setPage] = useSessionStorage('Page', 1);
	const [zip, setZip] = useSessionStorage('Zip', '');
	const [type, setType] = useSessionStorage('Type', '');
	const [ename, setEname] = useSessionStorage('Name', '');
	const [cost, setCost] = useSessionStorage('Cost', 1000000);
	const [resetCalled, setResetCalled] = useState<boolean>(false);
	const [eventCards, setEventCards] = useState<JSX.Element[][]>([]);
	const [pageSize, setPageSize] = useState(1);

	const [eventDate, setEventDate] = useSessionStorage(
		'Date',
		new Date().toISOString()
	);

	const [displayedDate, setDisplayedDate] = useSessionStorage(
		'DisplayedDate',
		getTimestamp()
	);

	const [shouldFetch, setShouldFetch] = useSessionStorage(
		'ShouldFetch',
		true
	);
	const [dataChanged, setDataChanged] = useSessionStorage(
		'DataChanged',
		true
	);

	const applyFilters = () => {
		try {
			setEventDate(new Date(displayedDate).toISOString());
		} catch {
			setEventDate(new Date().toISOString());
			setDisplayedDate(getTimestamp());
		}
		setShouldFetch(true);
	};

	useEffect(() => {
		const requests = [];
		const cards: JSX.Element[][] = [];
		for (let i = 0; i < pageSize; i++) {
			requests.push(
				getEvents(
					i + page * pageSize,
					zip,
					type,
					ename,
					cost,
					eventDate
				)
			);
		}
		Promise.allSettled(requests).then((responses) => {
			responses.map((response: PromiseSettledResult<JSX.Element[]>) =>
				response.status === 'fulfilled' && response.value
					? cards.push(response.value)
					: 0
			);
			setEventCards(cards);
		});
		return;
	}, [zip, type, ename, cost, eventDate, page, pageSize]);

	return (
		<Flex pt="3" justify={'start'} gap="3">
			<Box
				style={{
					display: 'flex',
					flexDirection: 'column',
					rowGap: '10px'
				}}
			>
				<Button
					onClick={() => setShowSidebar(!showSidebar)}
					color="purple"
					style={{ width: '100px', alignSelf: 'flex-start' }}
				>
					Filter
				</Button>

				{showSidebar && (
					<Box
						style={{
							width: '275px',
							padding: '10px',
							display: 'flex',
							flexDirection: 'column',
							rowGap: '10px',
							backgroundColor: 'white',
							boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
							borderRadius: '6px'
						}}
					>
						<PopoverLabel>
							<Text as="div" size="2" mb="1" weight="bold">
								Type
							</Text>
							<Select.Root
								value={type}
								onValueChange={(value) => {
									setType(value);
									setDataChanged(true);
								}}
							>
								<Select.Trigger placeholder="Select Event Type" />
								<Select.Content>
									<Select.Group>
										{AllEventTypesArray.map((event) => (
											<Select.Item
												key={event}
												value={event}
											>
												{event}
											</Select.Item>
										))}
									</Select.Group>
								</Select.Content>
							</Select.Root>
						</PopoverLabel>

						<PopoverLabel>
							<Text as="div" size="2" mb="1" weight="bold">
								Maximum Cost
							</Text>
							<TextField.Root
								name="Cost"
								placeholder="1000000"
								value={cost}
								onChange={(e) => {
									setCost(Number(e.target.value));
									setDataChanged(true);
								}}
							/>
						</PopoverLabel>

						<PopoverLabel>
							<Text as="div" size="2" mb="1" weight="bold">
								Time
							</Text>
							<TextField.Root
								name="Time"
								value={displayedDate}
								onChange={(e) => {
									setDisplayedDate(e.target.value);
									setDataChanged(true);
								}}
								type="datetime-local"
							/>
						</PopoverLabel>

						<PopoverLabel>
							<Text>Zip</Text>
							<TextField.Root
								name="Zip"
								value={zip}
								onChange={(e) => {
									setZip(e.target.value);
									setDataChanged(true);
								}}
								pattern={'d{5}'}
							/>
						</PopoverLabel>
						<Flex gap={'10px'} justify={'center'}>
							<Button
								onClick={() => {
									setResetCalled(true);
									setType('');
									setZip('');
									setCost(1000000);
									setDisplayedDate(getTimestamp());
									setEventDate(new Date().toISOString());
									setShouldFetch(true);
								}}
								style={{ backgroundColor: 'red', flex: '1' }}
							>
								Clear Filters
							</Button>
							<Button
								onClick={applyFilters}
								color="purple"
								style={{ flex: '1' }}
							>
								Apply Filters
							</Button>
						</Flex>
					</Box>
				)}
			</Box>
			<Flex width="66%" direction={'row'} wrap={'wrap'} gap="3">
				{eventCards.map((cards: JSX.Element[]) => cards)}
			</Flex>
		</Flex>
	);
}

async function getEvents(
	page: number,
	zip: string,
	type: string,
	name: string | null,
	cost: number,
	eventDate: string
) {
	const url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${name ?? ''}&Basecost=${cost}&EventDatetime=${eventDate}`;
	const authToken = getAuthToken();
	const resp = await fetch(url, {
		method: 'GET',
		headers: { Authorization: `Bearer ${authToken}` }
	});

	if (!resp.ok) {
		console.error('There was an error fetching data', resp);
		return [];
	}

	const data = await resp.json();

	return await (data && data.length !== 0
		? data.map((event: UserEventResponse, idx: number) => (
				<EventCard key={`${idx}:${event.Name}`} event={event} />
			))
		: undefined);
}
