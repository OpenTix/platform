import { Venue, Event } from '@platform/types';
import {
	Tabs,
	Box,
	Flex,
	TextField,
	Button,
	Container
} from '@radix-ui/themes';
import { useState } from 'react';
import AddEventModal from '../components/AddEventModal';
import AddVenueModal from '../components/AddVenueModal';
import VendorTable from '../components/VendorTable';

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

	const addRow = () => {
		setModalType(activeTab);
		setShowModal(true);
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
					venue.name.toLowerCase().includes(filterString)
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
							<VendorTable rowData={eventDisplay} />
						</Tabs.Content>
						<Tabs.Content value="venues">
							<VendorTable rowData={venueDisplay} />
						</Tabs.Content>
					</Box>
				</Tabs.Root>
				{showModal &&
					modalType &&
					(modalType === 'events' ? (
						<AddEventModal onClose={() => setShowModal(false)} />
					) : (
						<AddVenueModal onClose={() => setShowModal(false)} />
					))}
			</Box>
		</Container>
	);
}
