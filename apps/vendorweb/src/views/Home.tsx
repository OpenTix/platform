// import { VenueData } from '../../../../packages/types/src/VenueData';
import { VenueData, EventData } from '@platform/types';
import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import {
	Tabs,
	Box,
	Flex,
	TextField,
	Button,
	Container,
	Text,
} from '@radix-ui/themes';

import {
	useQuery,
	QueryClient,
	QueryClientProvider,
 } from '@tanstack/react-query';

import { useState } from 'react';
import Modal from '../components/EventAddModal';
import VendorTable from '../components/VendorTable';
import { Token } from 'aws-cdk-lib';

const queryClient = new QueryClient();

export default function Home() {
	const [eventData, setEventData] = useState<EventData[]>([
		{ id: 'otherstuff', date: Date.now(), name: 'Sample Event' }
	]);
	const [venueData, setVenueData] = useState<VenueData[]>([
		{
			id: 'somestuff',
			date: Date.now(),
			location: 'Sample Venue',
			name: 'Sample Name',
			streetAddr: '123 sample st',
			zip: 123456,
			city: 'some city',
			stateCode: 'aa',
			stateName: 'state',
			countryCode: 'usa',
			countryName: 'country',
			numUnique: 10,
			numGa: 10
		} as VenueData
	]);
	const [eventDisplay, setEventDisplay] = useState(eventData);
	const [venueDisplay, setVenueDisplay] = useState(venueData);
	const [activeTab, setActiveTab] = useState<'events' | 'venues'>('events');

	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState<'events' | 'venues' | null>(
		null
	);

	const addRow = () => {
		setModalType(activeTab);
		setShowModal(true);
	};

	const handleAdd = (newItem: EventData | VenueData) => {
		if (modalType === 'events') {
			setEventData([...eventData, newItem as EventData]);
			setEventDisplay([...eventDisplay, newItem as EventData]);
		} else if (modalType === 'venues') {
			setVenueData([...venueData, newItem as VenueData]);
			setVenueDisplay([...venueDisplay, newItem as VenueData]);
		}
		setShowModal(false);
	};

	const filterData = (e: React.ChangeEvent<HTMLInputElement>) => {
		const filterString = e.target.value.toLowerCase();
		setEventDisplay(
			eventData.filter(
				(evnt) =>
					evnt.id.toLowerCase().includes(filterString) ||
					evnt.name.toLowerCase().includes(filterString)
			)
		);
		setVenueDisplay(
			venueData.filter(
				(venue) =>
					venue.id.includes(filterString) ||
					venue.location.toLowerCase().includes(filterString)
			)
		);
	};

	const updateTab = (e: string) => {
		setActiveTab(e as 'events' | 'venues');
	};

	return (
		<Container size={'4'}>

			<Box style={{ padding: '16px 16px' }}>
				<Tabs.Root defaultValue={activeTab} onValueChange={updateTab}>
					<Flex justify="between">
						<Tabs.List size="2">
							<Tabs.Trigger value="events">Events</Tabs.Trigger>
							<Tabs.Trigger value="venues">Venues</Tabs.Trigger>
						</Tabs.List>
						<Flex>
							<TextField.Root
								placeholder="search"
								size="3"
								onChangeCapture={filterData}
								style={{ marginRight: '8px' }}
							></TextField.Root>

							<Button
								onClick={addRow}
								size="3"
								style={{ marginRight: '4px' }}
							>
								{' '}
								+{' '}
							</Button>
						</Flex>
					</Flex>
					<Box>
						<Tabs.Content value="events">
						<QueryClientProvider client={queryClient}>
							<Events/>
						</QueryClientProvider>
						</Tabs.Content>
						<Tabs.Content value="venues">
						<QueryClientProvider client={queryClient}>
							<Venues/>
						</QueryClientProvider>
						</Tabs.Content>
					</Box>
				</Tabs.Root>
				{showModal && modalType && (
					<Modal
						type={modalType}
						onSubmit={handleAdd}
						onClose={() => setShowModal(false)}
					/>
				)}
			</Box>
		</Container>
	);
}


function Venues(){
	const { isPending, isError, data, error } = useQuery({
		queryKey: ['venues'],
		queryFn: fetchVenues,
	});

	if(isPending){
		console.log("loading venues...");
		return (<Text> Loading... </Text>);
	}

	if(isError){
		console.error(error.message);
		return (<Text>Error: {error.message}</Text>);
	}

	console.log(data ?? "no data but the request was successfull");

	return (<VendorTable rowData={data} tableType='venue'/>);
}

function Events(){
	const { isPending, isError, data, error } = useQuery({
		queryKey: ['events'],
		queryFn: fetchEvents,
	});

	if(isPending){
		console.log("loading events...");
		return (<Text> Loading... </Text>);
	}

	if(isError){
		console.error(error.message);
		return (<Text>Error: {error.message}</Text>);
	}

	console.log(data ?? "no data but the request was successfull");

	return (<VendorTable rowData={data} tableType='event'/>);
}

async function fetchVenues(){
	const authToken = getAuthToken();
	return await fetch(`${process.env.NX_PUBLIC_API_BASEURL}/vendor/venues`, {method:'GET', headers:{Authorization: `Bearer ${authToken}`}})
					.then((resp)=> resp.json())
					.then((data) => data)
					.catch((error) => error);
}

async function fetchEvents(){
	const authToken = getAuthToken();
	return await fetch(`${process.env.NX_PUBLIC_API_BASEURL}/vendor/events`, {method:'GET', headers:{Authorization: `Bearer ${authToken}`}})
					.then((resp)=> resp.json())
					.then((data) => data)
					.catch((error) => error);
}