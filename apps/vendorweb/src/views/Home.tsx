import { Tabs, Box, Flex, TextField, Button } from '@radix-ui/themes';
import { useState } from 'react';
import Modal from '../components/EventAddModal';
import VendorTable from '../components/VendorTable';

type EventData = {
	id: string;
	date: number;
	name: string;
};

type VenueData = {
	id: string;
	date: number;
	location: string;
};

export default function Home() {
	const [eventData, setEventData] = useState<EventData[]>([
		{ id: 'otherstuff', date: Date.now(), name: 'Sample Event' }
	]);
	const [venueData, setVenueData] = useState<VenueData[]>([
		{ id: 'somestuff', date: Date.now(), location: 'Sample Venue' }
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
		<Box minWidth="1200px">
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
						></TextField.Root>

						<Button onClick={addRow} size="3">
							{' '}
							+{' '}
						</Button>
					</Flex>
				</Flex>
				<Box>
					<Tabs.Content value="events">
						<VendorTable rowData={eventDisplay} />
					</Tabs.Content>
					<Tabs.Content value="venues">
						<VendorTable rowData={venueDisplay} />
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
	);
}
