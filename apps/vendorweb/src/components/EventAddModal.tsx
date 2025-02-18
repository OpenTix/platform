import { VenueData, EventData } from '@platform/types';
import { Dialog, Button, TextField } from '@radix-ui/themes';
import { useState } from 'react';

type ModalProps = {
	type: 'events' | 'venues';
	onSubmit: (data: EventData | VenueData) => void;
	onClose: () => void;
};

export default function Modal({ type, onSubmit, onClose }: ModalProps) {
	const [formData, setFormData] = useState({
		id: '',
		name: '',
		location: '',
		streetAddr: '',
		zip: '',
		city: '',
		stateCode: '',
		countryCode: '',
		numUnique: '',
		numGa: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = () => {
		if(type === 'events') {
			if(formData.name === '') {
				alert("Please fill out all fields");
				return;
			}
		}
		else {
			if (formData.location === '' || formData.name === '' ||
				formData.streetAddr === '' || formData.zip === '' ||
				formData.countryCode === '' || formData.numUnique === '' ||
				formData.numGa === '') {
					alert("Please fill out all fields");
					return;
			}
			// Implement else if later to check ZIP is valid
		}
		const newItem = {
			id: formData.id || Math.random().toString(36).substring(7),
			date: Date.now(),
			...(type === 'events'
				? { name: formData.name }
				: {
						location: formData.location,
						name: formData.name,
						streetAddr: formData.streetAddr,
						zip: formData.zip,
						city: formData.city,
						stateCode: formData.stateCode,
						countryCode: formData.countryCode,
						numUnique: formData.numUnique,
						numGa: formData.numGa
					}
					
				)
		};
		onSubmit(newItem);
	};

	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="30vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					Add a New {type === 'events' ? 'Event' : 'Venue'}
				</Dialog.Title>
				{type === 'events' ? (
					<TextField.Root
						name="name"
						placeholder="Event Name"
						value={formData.name}
						onChange={handleChange}
						style={{
							marginBottom: '8px',
							width: '60%',
							marginLeft: '20%'
						}}
					/>
				) : (
					<>
						<TextField.Root
							name="location"
							placeholder="Venue Location"
							value={formData.location}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="name"
							placeholder="Venue Name"
							value={formData.name}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="streetAddr"
							placeholder="Venue Address"
							value={formData.streetAddr}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="zip"
							placeholder="Zip Code"
							value={formData.zip}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
							type="number"
							min="11111"
							max="99999"
						/>
						<TextField.Root
							name="city"
							placeholder="City"
							value={formData.city}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="stateCode"
							placeholder="State"
							value={formData.stateCode}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="countryCode"
							placeholder="Country"
							value={formData.countryCode}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
						/>
						<TextField.Root
							name="numUnique"
							placeholder="Special Admission Quantity"
							value={formData.numUnique}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
							type="number"
						/>
						<TextField.Root
							name="numGa"
							placeholder="General Admission Quantity"
							value={formData.numGa}
							onChange={handleChange}
							style={{
								marginBottom: '8px',
								width: '60%',
								marginLeft: '20%'
							}}
							type="number"
						/>
					</>
				)}
				<Button
					onClick={handleSubmit}
					style={{ marginRight: '8px', marginLeft: '20%' }}
				>
					Add
				</Button>
				<Button onClick={onClose} variant="soft">
					Cancel
				</Button>
			</Dialog.Content>
		</Dialog.Root>
	);
}
