import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { VenueCreationFormData } from '@platform/types';
import { TextField, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseModalForm } from '@platform/ui';

type AddVenueModalProps = {
	onClose: () => void;
};

export default function AddVenueModal({ onClose }: AddVenueModalProps) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [formData, setFormData] = useState({
		Name: '',
		StreetAddress: '',
		Zip: '',
		City: '',
		StateCode: '',
		StateName: '',
		CountryCode: '',
		CountryName: '',
		NumUnique: '',
		NumGa: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value
		});
	};

	const validate = (venue: VenueCreationFormData) => {
		if (
			venue.Name === '' ||
			venue.StreetAddress === '' ||
			!/^\d{5}$/.test(venue.Zip.toString()) ||
			venue.City === '' ||
			!/^[A-Z]{2}-[A-Z]{2}$/.test(venue.StateCode) ||
			venue.StateCode === '' ||
			!/^[A-Z]{2}$/.test(venue.CountryCode) ||
			venue.CountryName === '' ||
			Number.isNaN(venue.NumGa) ||
			Number.isNaN(venue.NumUnique) ||
			(venue.NumUnique === 0 && venue.NumGa === 0) ||
			venue.NumUnique < 0 ||
			venue.NumGa < 0
		) {
			setErrorMessage(
				'You are either missing a field or have an invalid input'
			);
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		const obj: VenueCreationFormData = {
			Name: formData.Name,
			StreetAddress: formData.StreetAddress,
			Zip: formData.Zip,
			City: formData.City,
			StateCode: formData.StateCode,
			StateName: formData.StateName,
			CountryCode: formData.CountryCode,
			CountryName: formData.CountryName,
			NumUnique: parseInt(formData.NumUnique),
			NumGa: parseInt(formData.NumGa)
		};

		if (!validate(obj)) {
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
					body: JSON.stringify(obj)
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
		navigate(0);
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
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					Unique Seats Quantity
				</Text>
				<TextField.Root
					name="NumUnique"
					placeholder="Unique Seats Quantity"
					value={formData.NumUnique}
					onChange={handleChange}
				/>
			</label>
			<label>
				<Text as="div" size="2" mb="1" weight="bold">
					General Admission Quantity
				</Text>
				<TextField.Root
					name="NumGa"
					placeholder="General Admission Quantity"
					value={formData.NumGa}
					onChange={handleChange}
				/>
			</label>
		</BaseModalForm>
	);
}
