import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { AllEventTypesArray, UserEventResponse } from '@platform/types';
import { Text, Box, Flex, Select, TextField, Progress } from '@radix-ui/themes';
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
	const defaultCost = 1000000;

	const [params, setParams] = useSearchParams();

	const [timeoutId, setTimeoutID] = useState<NodeJS.Timeout>();
	const [eventCards, setEventCards] = useState<JSX.Element[][]>([]);
	const [pageSize] = useState(1);

	const [, setDataChanged] = useSessionStorage('DataChanged', true);

	useEffect(() => {
		clearTimeout(timeoutId);
		setTimeoutID(
			setTimeout(() => {
				const requests = [];
				const cards: JSX.Element[][] = [];
				for (let i = 0; i < pageSize; i++) {
					requests.push(
						getEvents(
							i + Number(params.get('Page') ?? 1) * pageSize,
							params.get('Zip') ?? '',
							params.get('Type') ?? '',
							params.get('Name') ?? '',
							Number(params.get('Cost') ?? defaultCost),
							params.get('Date') ?? ''
						)
					);
				}
				Promise.allSettled(requests).then((responses) => {
					responses.map(
						(response: PromiseSettledResult<JSX.Element[]>) =>
							response.status === 'fulfilled' && response.value
								? cards.push(response.value)
								: 0
					);
					setEventCards(cards);
				});
			}, 500)
		);
	}, [params, pageSize]);

	return (
		<Flex pt="3" justify={'start'} gap="3">
			<Box
				style={{
					display: 'flex',
					flexDirection: 'column',
					rowGap: '10px',
					width: '17.5em'
				}}
			>
				<Box
					style={{
						width: '275px',
						padding: '10px',
						display: 'flex',
						flexDirection: 'column',
						rowGap: '10px',
						boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
						borderRadius: '6px'
					}}
				>
					<Text align={'center'} weight={'bold'}>
						Filter
					</Text>
					<Progress
						color="purple"
						my="2"
						value={100}
						style={{ height: '3px' }}
					/>
					<PopoverLabel>
						<Text as="div" size="2" mb="1" weight="bold">
							Type
						</Text>
						<Select.Root
							value={params.get('Type') ?? ''}
							onValueChange={(value) => {
								if (value !== 'all') {
									params.set('Type', value);
								} else {
									params.delete('Type');
								}
								setParams(params.toString());
								setDataChanged(true);
							}}
						>
							<Select.Trigger placeholder="Select Event Type" />
							<Select.Content>
								<Select.Group>
									<Select.Item key="all" value="all">
										All
									</Select.Item>
									{AllEventTypesArray.map((event) => (
										<Select.Item key={event} value={event}>
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
							placeholder={String(defaultCost)}
							value={Number(params.get('Cost') ?? defaultCost)}
							onChange={(e) => {
								if (Number(e.target.value) !== defaultCost) {
									params.set('Cost', e.target.value);
								} else {
									params.delete('Cost');
								}
								setParams(params.toString());
								setDataChanged(true);
							}}
						/>
					</PopoverLabel>

					<PopoverLabel>
						<Text as="div" size="2" mb="1" weight="bold">
							Time
						</Text>
						<TextField.Root
							size="2"
							name="Time"
							value={
								params.get('Date') ?? new Date().toISOString()
							}
							onChange={(e) => {
								if (e.target.value) {
									params.set('Date', e.target.value);
								} else {
									params.delete('Date');
								}
								setParams(params.toString());
								setDataChanged(true);
							}}
							type="datetime-local"
						/>
					</PopoverLabel>

					<PopoverLabel>
						<Text as="div" size="2" mb="1" weight="bold">
							Zip
						</Text>
						<TextField.Root
							name="Zip"
							value={params.get('Zip') ?? ''}
							onChange={(e) => {
								if (e.target.value !== '') {
									params.set('Zip', e.target.value);
								} else {
									params.delete('Zip');
								}
								setParams(params.toString());
								setDataChanged(true);
							}}
							pattern={'d{5}'}
						/>
					</PopoverLabel>
				</Box>
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
	const url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${name ?? ''}&Basecost=${cost}&EventDatetime=${eventDate ? eventDate + ':00.000Z' : ''}`;
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
