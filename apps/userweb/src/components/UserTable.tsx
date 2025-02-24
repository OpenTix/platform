import { Event, EVENT_KEYS, Venue, VENUE_KEYS } from '@platform/types';
import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';

interface tableData {
	rowData: Event[] | Venue[];
	tableType: 'event' | 'venue';
}

const EventKeys: string[] = [
	'Name',
	'Type',
	'Cost',
	'Time',
	'Description',
	'Disclaimer',
	'Unique Admission',
	'General Admission',
	'Zip'
];

export default function VendorTable({ rowData, tableType }: tableData) {
	const header = [];
	let labels: string[] = [];

	if (tableType === 'event') {
		labels = EventKeys;
	} else if (tableType === 'venue') {
		labels = VENUE_KEYS;
	}

	for (const label in labels) {
		header.push(
			<Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
				{labels[label]}
			</Table.ColumnHeaderCell>
		);
	}
	const tableHeader = <Table.Row>{header}</Table.Row>;

	const tableRows = (rowData ?? []).map((row, idx) => {
		const tableRow = [];
		for (const label in row) {
			tableRow.push(
				<Table.Cell style={{ textAlign: 'center' }}>
					{label === 'EventDatetime'
						? `${new Date(row[label as keyof typeof row])}`
						: row[label as keyof typeof row]}
				</Table.Cell>
			);
		}

		return <Table.Row key={idx}>{tableRow}</Table.Row>;
	});

	return (
		<Box>
			<ScrollArea>
				<Table.Root>
					<Table.Header>{tableHeader}</Table.Header>
					<Table.Body>{tableRows}</Table.Body>
				</Table.Root>
			</ScrollArea>
		</Box>
	);
}
