import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';

// import { useState } from 'react';

interface tableRowArray {
	rowData: tableRowData[];
}

interface tableRowData {
	id: string;
	date?: number;
	name?: string;
	location?: string;
}

export default function VendorTable({ rowData }: tableRowArray) {
	const firstColumnLabel = rowData.some((row) => row.name !== undefined)
		? 'Name'
		: 'Location';

	const tableHeader = (
		<Table.Row>
			<Table.ColumnHeaderCell>
				<Text>{firstColumnLabel}</Text>
			</Table.ColumnHeaderCell>
			<Table.ColumnHeaderCell>
				<Text>Event ID</Text>
			</Table.ColumnHeaderCell>
			<Table.ColumnHeaderCell>
				<Text>Date Published</Text>
			</Table.ColumnHeaderCell>
		</Table.Row>
	);

	const tableRows = rowData.map((row, idx) => (
		<Table.Row key={idx}>
			<Table.Cell>{row.name || row.location}</Table.Cell>
			<Table.Cell>{row.id}</Table.Cell>
			<Table.Cell>{new Date(row.date ?? 0).toString()}</Table.Cell>
		</Table.Row>
	));

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
