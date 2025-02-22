import { EventCreationFormData } from '@platform/types';
import { Dialog, Button, TextField } from '@radix-ui/themes';
import { useState } from 'react';

type AddEventModalProps = {
	onClose: () => void;
};

export default function AddEventModal({ onClose }: AddEventModalProps) {
	const [formData, setFormData] = useState<EventCreationFormData>({
		venue: 0,
		name: '',
		type: '',
		event_datetime: '',
		description: '',
		disclaimer: '',
		basecost: 0,
		num_unique: 0,
		num_ga: 0
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const validate = () => {
		//unique/ga validation done on backend
		if (
			formData.venue === 0 ||
			formData.name === '' ||
			formData.type === '' ||
			formData.event_datetime === '' ||
			formData.description === '' ||
			formData.disclaimer === '' ||
			formData.basecost === 0
		) {
			alert('Please fill out all fields');
			return false;
		}
		return true;
	};
	const handleSubmit = () => {
		if (!validate()) {
			return;
		}

		console.log(formData);
	};

	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="30vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					Add a New Event
				</Dialog.Title>
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
