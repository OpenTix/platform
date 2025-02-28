import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { Venue, Event } from '@platform/types';
import {
	Tabs,
	Box,
	Flex,
	TextField,
	Button,
	Container,
	Text
} from '@radix-ui/themes';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { SuccessAlert } from '@platform/ui';
import AddEventModal from '../components/AddEventModal';
import AddVenueModal from '../components/AddVenueModal';
import VendorTable from '../components/VendorTable';

const queryClient = new QueryClient();

export default function Home() {
	const [eventData, setEventData] = useState<Event[]>([]);
	const [venueData, setVenueData] = useState<Venue[]>([]);
	const [eventDisplay, setEventDisplay] = useState(eventData);
	const [venueDisplay, setVenueDisplay] = useState(venueData);
	const [activeTab, setActiveTab] = useState<'events' | 'venues'>('events');
	const [showModal, setShowModal] = useState(false);
	const [modalType, setModalType] = useState<'events' | 'venues' | null>(
		null
	);
	const [wasAddSuccessful, setWasAddSuccessful] = useState<boolean>(false);

	const addRow = () => {
		setModalType(activeTab);
		setShowModal(true);
	};

	const filterData = (e: React.ChangeEvent<HTMLInputElement>) => {
		const filterString = e.target.value.toLowerCase();
		setEventDisplay(
			eventData.filter(
				(evnt) =>
					evnt.ID.toLowerCase().includes(filterString) ||
					evnt.Name.toLowerCase().includes(filterString)
			)
		);
		setVenueDisplay(
			venueData.filter(
				(venue) =>
					venue.ID.includes(filterString) ||
					venue.Name.toLowerCase().includes(filterString)
			)
		);
	};

	const updateTab = (e: string) => {
		setActiveTab(e as 'events' | 'venues');
	};

	useEffect(() => {
		if (showModal && wasAddSuccessful) {
			setWasAddSuccessful(false);
		}
	}, [showModal, wasAddSuccessful]);

	useEffect(() => {
		if (wasAddSuccessful) {
			queryClient.invalidateQueries({ queryKey: ['events'] });
			queryClient.invalidateQueries({ queryKey: ['venues'] });
		}
	}, [wasAddSuccessful]);

	return (
		<Container size={'4'}>
			{wasAddSuccessful && (
				<Box pt="4">
					<SuccessAlert message="Created Successfully" />
				</Box>
			)}
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
								<Events />
							</QueryClientProvider>
						</Tabs.Content>
						<Tabs.Content value="venues">
							<QueryClientProvider client={queryClient}>
								<Venues />
							</QueryClientProvider>
						</Tabs.Content>
					</Box>
				</Tabs.Root>
				{showModal &&
					modalType &&
					(modalType === 'events' ? (
						<AddEventModal
							onClose={() => setShowModal(false)}
							onSuccess={() => setWasAddSuccessful(true)}
						/>
					) : (
						<AddVenueModal
							onClose={() => setShowModal(false)}
							onSuccess={() => setWasAddSuccessful(true)}
						/>
					))}
			</Box>
		</Container>
	);
}

function Venues() {
	const { isPending, isError, data, error } = useQuery({
		queryKey: ['venues'],
		queryFn: fetchVenues
	});

	if (isPending) {
		return <Text> Loading... </Text>;
	}

	if (isError) {
		console.error(error.message);
		return <Text>Error: {error.message}</Text>;
	}

	return <VendorTable rowData={data} tableType="venue" />;
}

function Events() {
	const { isPending, isError, data, error } = useQuery({
		queryKey: ['events'],
		queryFn: fetchEvents
	});

	if (isPending) {
		return <Text> Loading... </Text>;
	}

	if (isError) {
		console.error(error.message);
		return <Text>Error: {error.message}</Text>;
	}

	return <VendorTable rowData={data} tableType="event" />;
}

async function fetchVenues() {
	const authToken = getAuthToken();
	return await fetch(`${process.env.NX_PUBLIC_API_BASEURL}/vendor/venues`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${authToken}` }
	})
		.then((resp) => resp.json())
		.then((data) => data)
		.catch((error) => error);
}

async function fetchEvents() {
	const authToken = getAuthToken();
	return await fetch(`${process.env.NX_PUBLIC_API_BASEURL}/vendor/events`, {
		method: 'GET',
		headers: { Authorization: `Bearer ${authToken}` }
	})
		.then((resp) => resp.json())
		.then((data) => data)
		.catch((error) => error);
}
