import {Tabs, Box, Flex, TextField, Button, Section} from '@radix-ui/themes';
import { useState, ChangeEventHandler } from 'react';
import VendorTable from '../components/VendorTable';

export default function Home() {

	const [eventData, setEventData] = useState([{id:"otherstuff", date: Date.now()}]);
	const [venueData, setVenueData] = useState([{id:"somestuff", date: Date.now()}]);
	const [eventDisplay, setEventDisplay] = useState(eventData);
	const [venueDisplay, setVenueDisplay] = useState(venueData);
	const [activeTab, setActiveTab] = useState('events');

	const addRow = () => {
		switch (activeTab){
			case 'events':
				setEventData([...eventData, {id:"otherstuff", date: Date.now()}]); // TODO: call menu to make a new event
				break;
			case 'venues':
				setVenueData([...venueData, {id:"somestuff", date: Date.now()}]); // TODO: call menu to make a new venue
				break;
		}
	};

	const filterData = (e:any) => {
		let filterString = e.target.value;
		setEventDisplay(eventData.filter((evnt) => evnt.id == filterString || evnt.date == filterString));
		setVenueDisplay(venueData.filter((venue) => venue.id == filterString || venue.date == filterString));
	};

	const updateTab = (e:string) => {
		setActiveTab(e);
	};

	return (
	<Box minWidth='1200px'>
		<Tabs.Root defaultValue={activeTab} onValueChange={updateTab}>
			<Flex justify='between'>
				<Tabs.List size='2'>
					<Tabs.Trigger value='events'>Events</Tabs.Trigger>
					<Tabs.Trigger value='venues'>Venues</Tabs.Trigger>
				</Tabs.List>
				<Flex>
					<TextField.Root placeholder="search" size='3' onChangeCapture={filterData}>
					</TextField.Root>
					
					<Button onClick={addRow} size='3'> + </Button>
				</Flex>
			</Flex>
			<Box>
				<Tabs.Content value='events'>
					<VendorTable rowData={eventDisplay}/>
				</Tabs.Content>
				<Tabs.Content value='venues'>
					<VendorTable rowData={venueDisplay}/>
				</Tabs.Content>
			</Box>
		</Tabs.Root>
	</Box>
	);
}