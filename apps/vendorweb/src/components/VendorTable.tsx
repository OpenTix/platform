import { Event, EVENT_KEYS, Venue, VENUE_KEYS } from '@platform/types';
import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';

// you'll grab the baseurl and then I believe it's /vendor/venues and /vendor/events
// process.env.NX_PUBLIC_API_BASEURL

interface tableData {
	rowData: Event[] | Venue[];
	tableType: 'event' | 'venue';
}

export default function VendorTable({ rowData, tableType }: tableData) {
	const navigate = useNavigate();
	const header = [];
	let labels: string[] = [];

	if (tableType === 'event') {
		labels = EVENT_KEYS;
	} else if (tableType === 'venue') {
		labels = VENUE_KEYS;
	}

	for (const label in labels) {
		header.push(
			<Table.ColumnHeaderCell key={`${label}`}>
				<Text>{labels[label]}</Text>
			</Table.ColumnHeaderCell>
		);
	}
	const tableHeader = <Table.Row>{header}</Table.Row>;

	const tableRows = (rowData ?? []).map((row, idx) => {
		const tableRow = [];
		for (const label in row) {
			tableRow.push(
				<Table.Cell key={`${label}:${row[label as keyof typeof row]}`}>
					<Text>
						{label === 'EventDatetime'
							? `${new Date(row[label as keyof typeof row])}`
							: row[label as keyof typeof row]}
					</Text>
				</Table.Cell>
			);
		}

		return (
			<Table.Row
				key={idx}
				onClick={() => navigate(tableType + '/' + row.ID)}
			>
				{tableRow}
			</Table.Row>
		);
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
