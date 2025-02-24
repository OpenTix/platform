import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { VenueEditableFields } from '@platform/types';
import { TextField, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseModalForm } from '@platform/ui';

type EditVenueModalProps = {
	onClose: () => void;
	pk: number;
};

export default function EditVenueModal({ pk, onClose }: EditVenueModalProps) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [formData, setFormData] = useState<VenueEditableFields>({
		Name: '',
		StreetAddress: '',
		Zip: '',
		City: '',
		StateCode: '',
		StateName: '',
		CountryCode: '',
		CountryName: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		setFormData({
			...formData,
			[name]: type === 'number' ? parseInt(value, 10) || 0 : value
		});
	};

	const convertToBody = (event: VenueEditableFields): object => {
		let returnObject = {};
		for (const key in event) {
			const value = event[key as keyof VenueEditableFields];
			if (value !== '') {
				returnObject = { ...returnObject, [key]: value };
			}
		}
		return returnObject;
	};

	const handleSubmit = async () => {
		let body = convertToBody(formData);
		if (Object.keys(body).length === 0) {
			setErrorMessage('No fields were changed');
			setShouldShowError(true);
			return;
		}
		body = { ...body, Pk: pk };
		console.log(body);
		setShouldShowError(false);
		setIsSubmitting(true);
		try {
			const authToken = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL + '/vendor/venues',
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify(body)
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
		navigate(0);
	};

	return (
		<BaseModalForm
			title="Update a Venue."
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			showError={shouldShowError}
			onSubmit={handleSubmit}
			onClose={onClose}
		>
			<Text>Only fields edited here will be changed.</Text>

			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Name
				</Text>
				<TextField.Root
					name="Name"
					placeholder="My Venue"
					value={formData.Name}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Street Address
				</Text>
				<TextField.Root
					name="StreetAddress"
					placeholder="123 Main Street"
					value={formData.StreetAddress}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Zip Code
				</Text>
				<TextField.Root
					name="Zip"
					placeholder="12345"
					value={formData.Zip}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					City
				</Text>
				<TextField.Root
					name="City"
					placeholder="Knoxville"
					value={formData.City}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					State Code
				</Text>
				<TextField.Root
					name="StateCode"
					placeholder="TN-US"
					value={formData.StateCode}
					onChange={handleChange}
					pattern="^[A-Z]{2}-[A-Z]{2}$"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					State Name
				</Text>
				<TextField.Root
					name="StateName"
					placeholder="Tennessee"
					value={formData.StateName}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Country Code
				</Text>
				<TextField.Root
					name="CountryCode"
					placeholder="US"
					value={formData.CountryCode}
					onChange={handleChange}
					pattern="^[A-Z]{2}$"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Country Name
				</Text>
				<TextField.Root
					name="CountryName"
					placeholder="United States"
					value={formData.CountryName}
					onChange={handleChange}
				/>
			</label>
		</BaseModalForm>
	);
}
