import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { VenueCreationFormData } from '@platform/types';
import { TextField, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { BaseModalForm } from '@platform/ui';

type AddVenueModalProps = {
	onClose: () => void;
};

export default function AddVenueModal({ onClose }: AddVenueModalProps) {
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [formData, setFormData] = useState<VenueCreationFormData>({
		Name: '',
		StreetAddress: '',
		Zip: '',
		City: '',
		StateCode: '',
		StateName: '',
		CountryCode: '',
		CountryName: '',
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

	const validate = () => {
		if (
			formData.Name === '' ||
			formData.StreetAddress === '' ||
			!/^\d{5}$/.test(formData.Zip.toString()) ||
			formData.City === '' ||
			!/^[A-Z]{2}-[A-Z]{2}$/.test(formData.StateCode) ||
			formData.StateCode === '' ||
			!/^[A-Z]{2}$/.test(formData.CountryCode) ||
			formData.CountryName === '' ||
			(formData.NumUnique === 0 && formData.NumGa === 0) ||
			formData.NumUnique < 0 ||
			formData.NumGa < 0
		) {
			setErrorMessage(
				'You are either missing a field or have an invalid input'
			);
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validate()) {
			setShouldShowError(true);
			return;
		}
		setShouldShowError(false);
		setIsSubmitting(true);
		try {
			const authToken = getAuthToken();
			const res = await fetch(
				process.env.NX_PUBLIC_API_BASEURL + '/vendor/venues',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify(formData)
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
			setErrorMessage('Failed to add venue');
			setShouldShowError(true);
			setIsSubmitting(false);
			return;
		}
		setIsSubmitting(false);
		onClose();
	};

	return (
		<BaseModalForm
			title="Add a New Venue"
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			showError={shouldShowError}
			onSubmit={handleSubmit}
			onClose={onClose}
		>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Name
				</Text>
				<TextField.Root
					name="name"
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
					name="street_address"
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
					name="zip"
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
					name="city"
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
					name="state_code"
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
					name="state_name"
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
					name="country_code"
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
					name="country_name"
					placeholder="United States"
					value={formData.CountryName}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Unique Seats Quantity
				</Text>
				<TextField.Root
					name="num_unique"
					placeholder="Unique Seats Quantity"
					value={formData.NumUnique}
					onChange={handleChange}
					type="number"
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					General Admission Quantity
				</Text>
				<TextField.Root
					name="num_ga"
					placeholder="General Admission Quantity"
					value={formData.NumGa}
					onChange={handleChange}
					type="number"
				/>
			</label>
		</BaseModalForm>
	);
}
