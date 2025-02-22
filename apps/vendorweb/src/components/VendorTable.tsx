import { Event, Venue } from '@platform/types';
import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';

interface tableData {
	rowData: Event[] | Venue[];
}

export default function VendorTable({ rowData }: tableData) {
	const header = [];
	for (const label in rowData[0]) {
		header.push(
			<Table.ColumnHeaderCell>
				<Text>{label}</Text>
			</Table.ColumnHeaderCell>
		);
	}
	const tableHeader = <Table.Row>{header}</Table.Row>;

	const tableRows = rowData.map((row, idx) => {
		const tableRow = [];
		for (const label in row) {
			tableRow.push(
				<Table.Cell>
					<Text>
						{label === 'date'
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
