import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { EventEditableFields } from '@platform/types';
import { TextField, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseModalForm } from '@platform/ui';

type EditEventModalProps = {
	onClose: () => void;
	onSuccess: () => void;
	pk: number;
};

export default function EditEventModal({
	pk,
	onClose,
	onSuccess
}: EditEventModalProps) {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [shouldShowError, setShouldShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [formData, setFormData] = useState<EventEditableFields>({
		Type: '',
		Description: '',
		Disclaimer: ''
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData({
			...formData,
			[name]: value
		});
	};

	const convertToBody = (event: EventEditableFields): object => {
		let returnObject = {};
		for (const key in event) {
			const value = event[key as keyof EventEditableFields];
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
				process.env.NX_PUBLIC_API_BASEURL + '/vendor/events',
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
		onSuccess();
		onClose();
	};

	return (
		<BaseModalForm
			title="Update an Event."
			isSubmitting={isSubmitting}
			errorMessage={errorMessage}
			showError={shouldShowError}
			onSubmit={handleSubmit}
			onClose={onClose}
		>
			<Text>Only fields edited here will be changed.</Text>

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
		</BaseModalForm>
	);
}
