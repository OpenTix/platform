import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { UserEventDetailsResponse, Event } from '@platform/types';
import { Button } from '@radix-ui/themes';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import BuyTicketsModal from '../components/BuyTicketsModal';

export default function EventDetailsPage() {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	const id = useParams().id!;
	const [eventdata, setEventData] = useState<
		UserEventDetailsResponse[] | null
	>(null);
	const [shouldShowBuyModal, setShouldShowBuyModal] =
		useState<boolean>(false);
	const [data, setData] = useState<UserEventDetailsResponse>();

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
		Promise.resolve(resp.json()).then((d) => {
			setEventData(d);
			setData(d);
			console.log(d);
		});

		// console.log(data)
	}

	useEffect(() => {
		getEventDetails();
	}, []);

	return (
		<div>
			{eventdata ? <div>Data</div> : <div>HelloWorld</div>}
			{
				<Button onClick={() => setShouldShowBuyModal(true)}>
					Please touch me.
				</Button>
			}
			{shouldShowBuyModal && (
				<BuyTicketsModal
					onClose={() => setShouldShowBuyModal(false)}
					Title={(data as UserEventDetailsResponse)?.Eventname}
					EventDatetime={
						(data as UserEventDetailsResponse)?.EventDatetime
					}
					ID={(data as UserEventDetailsResponse)?.ID}
				/>
			)}
		</div>
	);
}
