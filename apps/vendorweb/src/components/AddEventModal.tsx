import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import {
	AllVenuesListSimplifiedResponse,
	EventCreationFormData
} from '@platform/types';
import { Select, TextField, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { BaseModalForm } from '@platform/ui';

type AddEventModalProps = {
	onClose: () => void;
};

export default function AddEventModal({ onClose }: AddEventModalProps) {
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [venueList, setVenueList] = useState<
		AllVenuesListSimplifiedResponse[]
	>([]);
	const [formData, setFormData] = useState<EventCreationFormData>({
		Venue: 0,
		Name: '',
		Type: '',
		EventDatetime: '',
		Description: '',
		Disclaimer: '',
		Basecost: 0,
		NumUnique: 0,
		NumGa: 0
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		setFormData({
			...formData,
			[name]: type === 'number' ? parseInt(value, 10) || 0 : value
		});
	};

	const isIsoString = (str: string) => {
		if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str))
			return false;
		const d = new Date(str);
		return !isNaN(d.getTime()) && d.toISOString() === str;
	};

	const validate = (event: EventCreationFormData) => {
		if (
			event.Venue === 0 ||
			event.Name === '' ||
			event.Type === '' ||
			!isIsoString(event.EventDatetime) ||
			event.Description === '' ||
			event.Disclaimer === '' ||
			event.Basecost === 0 ||
			event.NumUnique + event.NumGa < 0
		) {
			setErrorMessage(
				'You are either missing a field or have an invalid input'
			);
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		// Convert local string to ISO String
		const eventToSubmit = { ...formData };
		eventToSubmit.EventDatetime = new Date(
			formData.EventDatetime
		).toISOString();

		if (!validate(eventToSubmit)) {
			setShouldShowError(true);
			return;
		}
		setShouldShowError(false);
		setIsSubmitting(true);
		try {
			const authToken = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL + '/vendor/events',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify(eventToSubmit)
				}
			);
			const data = await res.json();
			if (!res.ok) {
				setErrorMessage(res.status + ': ' + data.message);
				setShouldShowError(true);
				setIsSubmitting(false);
				return;
			}
		} catch (error) {
			console.error(error);
			setErrorMessage('An Error Occurred');
			setShouldShowError(true);
			setIsSubmitting(false);
			return;
		}
		setIsSubmitting(false);
		onClose();
	};

	const getVenues = async () => {
		try {
			const authToken = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL + '/vendor/venues?all=true',
				{
					method: 'GET',
					headers: {
						Authorization: `Bearer ${authToken}`
					}
				}
			);
			const data = await res.json();
			if (!res.ok) {
				setErrorMessage(res.status + ' ' + data.message);
				setShouldShowError(true);
			}
			setVenueList(data);
		} catch (error) {
			console.error(error);
			setErrorMessage('An Error Occurred');
			setShouldShowError(true);
		}
	};

	useEffect(() => {
		getVenues();
	}, []);

	return (
		<BaseModalForm
			title="Add a New Event"
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			showError={shouldShowError}
			onSubmit={handleSubmit}
			onClose={onClose}
		>
			<Select.Root
				onValueChange={(val) =>
					setFormData({
						...formData,
						Venue: parseInt(val, 10) || 0
					})
				}
			>
				<Select.Trigger placeholder="Venue" />
				<Select.Content>
					{(venueList ?? []).map(
						(venue: AllVenuesListSimplifiedResponse) => (
							<Select.Item
								key={venue.Pk}
								value={String(venue.Pk)}
							>
								{venue.Name}
							</Select.Item>
						)
					)}
				</Select.Content>
			</Select.Root>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Name
				</Text>
				<TextField.Root
					name="Name"
					placeholder="My Event"
					value={formData.Name}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Type
				</Text>
				<TextField.Root
					name="Type"
					placeholder="Concert"
					value={formData.Type}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Event Date
				</Text>
				<TextField.Root
					name="EventDatetime"
					value={formData.EventDatetime}
					onChange={handleChange}
					type="datetime-local"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Description
				</Text>
				<TextField.Root
					name="Description"
					placeholder="This is a description"
					value={formData.Description}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Disclaimer
				</Text>
				<TextField.Root
					name="Disclaimer"
					placeholder="This is a disclaimer"
					value={formData.Disclaimer}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Base Cost
				</Text>
				<TextField.Root
					name="Basecost"
					placeholder="100"
					value={formData.Basecost}
					onChange={handleChange}
					type="number"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Unique Seats Quantity
				</Text>
				<TextField.Root
					name="NumUnique"
					placeholder="100"
					value={formData.NumUnique}
					onChange={handleChange}
					type="number"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					General Admission Seats Quantity
				</Text>
				<TextField.Root
					name="NumGa"
					placeholder="100"
					value={formData.NumGa}
					onChange={handleChange}
					type="number"
				/>
			</label>
		</BaseModalForm>
	);
}
