import {Text, Button, Table, Box, ScrollArea} from '@radix-ui/themes';
import { useState } from 'react';

interface tableRowArray{
    rowData:tableRowData[];
}

interface tableRowData{
    id:string;
    date?:number;
};

export default function VendorTable({rowData}:tableRowArray){

    const tableHeader = (
        <Table.Row>
            <Table.ColumnHeaderCell>
                <Text>id</Text>
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>
                <Text>date</Text>
            </Table.ColumnHeaderCell>
        </Table.Row>
    );

    const tableRows = rowData.map((row, idx) =>
        <Table.Row key={idx}>
            <Table.Cell>
                {row.id}
            </Table.Cell>
            <Table.Cell>
                {new Date(row.date ?? 0).toString()}
            </Table.Cell>
        </Table.Row>
    );

    return (
    <Box>
        <ScrollArea>
            <Table.Root>
                <Table.Header>
                    {tableHeader}
                </Table.Header>
                <Table.Body>
                    {tableRows}
                </Table.Body>
            </Table.Root>
        </ScrollArea>
    </Box>
    );
}