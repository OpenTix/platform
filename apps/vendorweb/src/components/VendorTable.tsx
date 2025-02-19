import { Text, Table, Box, ScrollArea } from '@radix-ui/themes';
import { EventData, VenueData } from '@platform/types';

// import { useState } from 'react';

interface tableData {
	rowData: (EventData[] | VenueData[]);
}

export default function VendorTable({ rowData }:tableData) {
	
	let header = [];
	for(const label in rowData[0]){
		header.push(
			<Table.ColumnHeaderCell>
				<Text>
					{label}
				</Text>
			</Table.ColumnHeaderCell>
		)
	}
	const tableHeader = (
		<Table.Row>
			{header}
		</Table.Row>
	);

	const tableRows = rowData.map((row, idx) => {
	let tableRow = [];
	for(const label in row){
		tableRow.push(
			<Table.Cell>
				<Text>
					{label=='date'? `${new Date(row[label as keyof typeof row])}` :row[label as keyof typeof row]}
				</Text>
			</Table.Cell>
		);
	}

	return (
		<Table.Row key={idx}>
			{tableRow}
		</Table.Row>
	)});

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
