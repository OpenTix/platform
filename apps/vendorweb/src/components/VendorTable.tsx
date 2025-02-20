import { EventData, VenueData } from '@platform/types';
import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';

// you'll grab the baseurl and then I believe it's /vendor/venues and /vendor/events
// process.env.NX_PUBLIC_API_BASEURL

interface tableData {
	rowData: EventData[] | VenueData[];
	tableType: 'event' | 'venue';
}

export default function VendorTable({ rowData, tableType }: tableData) {
	let header = [];
	let labels:string[] = [];

	if(tableType == 'event'){
		labels = getEventLabels();
	}else if(tableType == 'venue'){
		labels = getVenueLabels();
	}

	for (const label in labels) {
		header.push(
			<Table.ColumnHeaderCell>
				<Text>{labels[label]}</Text>
			</Table.ColumnHeaderCell>
		);
	}
	const tableHeader = <Table.Row>{header}</Table.Row>;

	const tableRows = (rowData ?? []).map((row, idx) => {
		let tableRow = [];
		for (const label in row) {
			tableRow.push(
				<Table.Cell>
					<Text>
						{label == 'date'
							? `${new Date(row[label as keyof typeof row])}`
							: row[label as keyof typeof row]}
					</Text>
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


function getEventLabels(){
	return ['id',
			'date',
			'name'];
}

function getVenueLabels(){
	return ['id',
			'date',
			'location',
			'name',
			'streetAddr',
			'zip',
			'city',
			'stateCode',
			'stateName',
			'countryCode',
			'countryName',
			'numUnique',
			'numGa'];
}