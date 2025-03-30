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
	Select,
	Button
} from '@radix-ui/themes';
import { Toolbar } from 'radix-ui';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSessionStorage } from 'usehooks-ts';
import EventRow from '../components/EventRow';

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
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
	column-gap: 5px;
	margin-top: 10px;
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
		new Date().toISOString()
	);
	const [displayedDate, setDisplayedDate] = useSessionStorage(
		'DisplayedDate',
		getTimestamp()
	);
	const [tempType, setTempType] = useState(type);
	const [tempCost, setTempCost] = useState(cost);
	const [tempZip, setTempZip] = useState(zip);
	const [tempEventDate, setTempEventDate] = useState(eventDate);
	const [tempEname, setTempEname] = useState(ename);

	const resetFilters = () => {
		setTempType('');
		setTempCost(1000000);
		setTempZip('');
		setTempEventDate(
			new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		);

		setType('');
		setCost(1000000);
		setZip('');
		setEventDate(
			new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
				.toISOString()
				.slice(0, 16)
		);
		setEname('');
	};

	const [shouldFetch, setShouldFetch] = useSessionStorage(
		'ShouldFetch',
		true
	);
	const [dataChanged, setDataChanged] = useSessionStorage(
		'DataChanged',
		true
	);
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
		setShouldFetch(true);
		setDataChanged(true);
	}, []);

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
			if (resetCalled) {
				await resetFilters();
				setResetCalled(false);
			}

			setPageChanged(false);
			setShouldFetch(false);
			setDataChanged(false);

			setCards(
				AllEventTypesArray.map((eventType: string, idx: number) =>
					type !== '' && eventType !== type ? (
						<></>
					) : (
						<EventRow
							key={`${idx}:${eventType}`}
							zip={zip}
							type={eventType}
							name={ename}
							cost={cost.toString()}
							eventDate={eventDate}
						/>
					)
				)
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
		<Flex align="start" gap="4" style={{ marginTop: '10px' }}>
			<Container style={{ alignSelf: 'center' }} size={'4'}>
				<Box style={{ maxWidth: '90vw', padding: '16px 16px' }}>
					{cards}
				</Box>
			</Container>
		</Flex>
	);
}
