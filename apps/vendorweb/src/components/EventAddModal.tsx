import { Dialog, Button, TextField } from '@radix-ui/themes';
import { useState } from 'react';

type EventData = {
	id: string;
	date: number;
	name: string;
};

type VenueData = {
	id: string;
	date: number;
	location: string;
};

type ModalProps = {
	type: 'events' | 'venues';
	onSubmit: (data: EventData | VenueData) => void;
	onClose: () => void;
};

export default function Modal({ type, onSubmit, onClose }: ModalProps) {
	const [formData, setFormData] = useState({
		id: '',
		name: '',
		location: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = () => {
		const newItem = {
			id: formData.id || Math.random().toString(36).substring(7),
			date: Date.now(),
			...(type === 'events'
				? { name: formData.name }
				: { location: formData.location })
		};
		onSubmit(newItem);
	};

	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content>
				<Dialog.Title>
					Add a New {type === 'events' ? 'Event' : 'Venue'}
				</Dialog.Title>
				<TextField.Root
					name="id"
					placeholder="ID"
					value={formData.id}
					onChange={handleChange}
				/>
				{type === 'events' ? (
					<TextField.Root
						name="name"
						placeholder="Event Name"
						value={formData.name}
						onChange={handleChange}
					/>
				) : (
					<TextField.Root
						name="location"
						placeholder="Venue Location"
						value={formData.location}
						onChange={handleChange}
					/>
				)}
				<Button onClick={handleSubmit}>Add</Button>
				<Button onClick={onClose} variant="soft">
					Cancel
				</Button>
			</Dialog.Content>
		</Dialog.Root>
	);
}
