import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventResponse } from '@platform/types';
import { AllEventTypesArray } from '@platform/types';
import {
	Box,
	Container,
	Flex,
	Text,
	TextField,
	Card,
	Select
} from '@radix-ui/themes';
import { Popover, Toolbar } from 'radix-ui';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSessionStorage } from 'usehooks-ts';
import { EventCard } from '../components/EventCard';

const TBButton = styled(Toolbar.Button)`
	padding-left: 10px;
	padding-right: 10px;
	color: white;
	background-color: #4e3282;
	border-radius: 6px;
	&:hover {
		background-color: #30304a;
		color: white;
	}
`;

const TBRoot = styled(Toolbar.Root)`
	max-width: 30vw;
	width: fit-content;
	display: flex;
	padding: 10px;
	min-width: max-content;
	border-radius: 6px;
	background-color: white;
	box-shadow: 0 2px 10px black;
	column-gap: 5px;
	margin-top: 10px;
`;

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

export default function Home() {
	const [page, setPage] = useSessionStorage('Page', 1);
	const [zip, setZip] = useSessionStorage('Zip', '');
	const [type, setType] = useSessionStorage('Type', '');
	const [ename, setEname] = useSessionStorage('Name', '');
	const [cost, setCost] = useSessionStorage('Cost', 1000000);
	const [eventDate, setEventDate] = useSessionStorage(
		'Date',
		new Date().toString()
	);
	const [displayedDate, setDisplayedDate] = useSessionStorage(
		'DisplayedDate',
		getTimestamp()
	);

	const [shouldFetch, setShouldFetch] = useState<boolean>(true);
	const [dataChanged, setDataChanged] = useState<boolean>(true);
	const [pageChanged, setPageChanged] = useState<boolean>(false);
	const [resetCalled, setResetCalled] = useState<boolean>(false);
	const [cards, setCards] = useState<React.ReactNode>(null);

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
		const resetFilters = () => {
			setDisplayedDate(getTimestamp());
			setEventDate(new Date(displayedDate).toISOString());
			setType('');
			setCost(1000000);
			setZip('');
			setPage(1);
		};

		async function getEvents() {
			let url: string;
			if (resetCalled) {
				await resetFilters();
				setResetCalled(false);
				url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${1}&Zip=${''}&Type=${''}&Name=${''}&Basecost=${''}&EventDatetime=${new Date().toISOString()}`;
			} else {
				url = `${process.env.NX_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${ename}&Basecost=${cost}&EventDatetime=${eventDate}`;
			}

			setPageChanged(false);
			setShouldFetch(false);
			setDataChanged(false);
			const authToken = getAuthToken();
			const resp = await fetch(url, {
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			});

			if (!resp.ok) {
				console.log('There was an error fetching data');
				return (
					<Card>
						<Text>There was an error fetching data</Text>
					</Card>
				);
			}

			const data = await resp.json();
			await setCards(
				<Flex gap="3" direction="column">
					{data && data.length > 0 ? (
						data.map((data: UserEventResponse, idx: number) => (
							<EventCard key={idx} event={data} />
						))
					) : (
						<Card>
							<Text>There are no results for page {page}</Text>
						</Card>
					)}
				</Flex>
			);
		}
		if ((shouldFetch && dataChanged) || resetCalled || pageChanged)
			getEvents();
	}, [
		cost,
		ename,
		eventDate,
		page,
		type,
		zip,
		shouldFetch,
		resetCalled,
		setEventDate,
		displayedDate,
		setType,
		setCost,
		setZip,
		setPage,
		setDisplayedDate,
		dataChanged,
		pageChanged
	]);

	return (
		<Flex>
			<Box style={{ marginTop: '10px' }}>
				<Flex gap="1" direction="column">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							setEname(ename);
							setDataChanged(true);
							applyFilters();
						}}
					>
						<Flex gap="2" align="center">
							<TextField.Root
								placeholder="Search"
								size="3"
								name="Name"
								value={ename}
								onChange={(e) => {
									setEname(e.target.value);
								}}
							/>
						</Flex>
					</form>
					<Popover.Root>
						<Popover.Trigger>
							<Toolbar.Root>
								<TBButton>Filter</TBButton>
							</Toolbar.Root>
						</Popover.Trigger>
						<Popover.Content
							style={{
								width: '275px',
								rowGap: '5px',
								display: 'flex',
								flexDirection: 'column',
								paddingRight: '10px',
								marginLeft: '5px',
								marginTop: '10px'
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
							<Toolbar.Root
								style={{ display: 'flex', columnGap: '5px' }}
							>
								<TBButton
									onClick={() => setResetCalled(true)}
									style={{ backgroundColor: 'red' }}
								>
									Clear Filters
								</TBButton>
								<TBButton onClick={applyFilters}>
									Apply Filters
								</TBButton>
							</Toolbar.Root>
						</Popover.Content>
					</Popover.Root>
				</Flex>
			</Box>
			<Container style={{ alignSelf: 'center' }} size={'4'}>
				<Box style={{ maxWidth: '90vw', padding: '16px 16px' }}>
					{cards}
					<TBRoot>
						{page > 1 ? (
							<TBButton
								onClick={() => {
									setPage(page - 1);
									setPageChanged(true);
								}}
								value={page - 1}
							>
								{page - 1}
							</TBButton>
						) : null}
						<TBButton
							style={{ backgroundColor: 'black' }}
							value={page}
						>
							{page}
						</TBButton>
						<TBButton
							onClick={() => {
								setPage(page + 1);
								setPageChanged(true);
							}}
							value={page + 1}
						>
							{page + 1}
						</TBButton>
						{page === 1 ? (
							<TBButton
								onClick={() => {
									setPage(page + 2);
									setPageChanged(true);
								}}
								value={page + 2}
							>
								{page + 2}
							</TBButton>
						) : null}
						<Toolbar.Separator>...</Toolbar.Separator>
						<TBButton
							onClick={() => {
								setPage(page + 4);
								setPageChanged(true);
							}}
							value={page + 4}
						>
							{page + 4}
						</TBButton>
					</TBRoot>
				</Box>
			</Container>
		</Flex>
	);
}
