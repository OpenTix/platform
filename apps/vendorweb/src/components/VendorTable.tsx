import { Event, EVENT_KEYS, Venue, VENUE_KEYS } from '@platform/types';
import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';

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
		switch (labels[label]) {
			case 'Pk':
			case 'ID':
			case 'Vendor':
			case 'Venue':
			case 'Photo':
				continue;
			default:
				header.push(
					<Table.ColumnHeaderCell>
						<Text>
							{labels[label] === 'TransactionHash'
								? 'Minted'
								: labels[label]}
						</Text>
					</Table.ColumnHeaderCell>
				);
		}
	}
	const tableHeader = <Table.Row>{header}</Table.Row>;

	const tableRows = (rowData ?? []).map((row, idx) => {
		const tableRow = [];
		for (const label in row) {
			switch (label) {
				case 'Pk':
				case 'ID':
				case 'Vendor':
				case 'Venue':
				case 'Photo':
					continue;
				case 'TransactionHash': {
					const val = row[label as keyof typeof row];
					tableRow.push(
						<Table.Cell>
							<Text>
								{val === '' || val === null || val === undefined
									? '❌'
									: '✅'}
							</Text>
						</Table.Cell>
					);
					break;
				}
				default:
					tableRow.push(
						<Table.Cell>
							<Text>
								{label === 'EventDatetime'
									? `${new Date(row[label as keyof typeof row]).toDateString()}`
									: row[label as keyof typeof row]}
							</Text>
						</Table.Cell>
					);
			}
		}

		return (
			<Table.Row
				key={idx}
				onClick={() => navigate(tableType + '/' + row.ID)}
				style={{
					cursor: 'pointer'
				}}
			>
				{tableRow}
			</Table.Row>
		);
	});

	return (
		<Box style={{ paddingBottom: '5px' }}>
			<ScrollArea>
				<Table.Root>
					<Table.Header>{tableHeader}</Table.Header>
					<Table.Body>{tableRows}</Table.Body>
				</Table.Root>
			</ScrollArea>
		</Box>
	);
}
