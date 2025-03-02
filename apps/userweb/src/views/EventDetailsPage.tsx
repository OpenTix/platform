import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse } from '@platform/types';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function EventDetailsPage() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const id = useParams().id!;
	const [eventdata, setEventData] = useState<Event[] | null>(null);

	async function getEventDetails() {
		const authToken = getAuthToken();
		const resp = await fetch(
			`${process.env.NX_PUBLIC_API_BASEURL}/user/events?ID=${id}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		);
		if (!resp.ok) {
			return null;
		}
		const json = await resp.json();
		console.log(json);
		setEventData(json);
	}

	useEffect(() => {
		getEventDetails();
	}, []);

	return <div>{eventdata ? <div>Data</div> : <div>HelloWorld</div>}</div>;
}
