import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Dialog, Button, Flex, Callout } from '@radix-ui/themes';
import React from 'react';

type BaseModalFormProps = {
	title: string;
	isSubmitting: boolean;
	errorMessage?: string;
	showError?: boolean;
	onSubmit: () => void;
	onClose: () => void;
	children: React.ReactNode;
};

export function BaseModalForm({
	title,
	isSubmitting,
	errorMessage,
	showError,
	onSubmit,
	onClose,
	children
}: BaseModalFormProps) {
	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="40vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					{title}
				</Dialog.Title>
				<Flex
					gap="1"
					direction="column"
					style={{ marginLeft: '10%', width: '80%' }}
				>
					{children}
					{showError && errorMessage && (
						<Callout.Root color="red">
							<Callout.Icon>
								<CrossCircledIcon />
							</Callout.Icon>
							<Callout.Text>{errorMessage}</Callout.Text>
						</Callout.Root>
					)}
					<Flex gap="1" style={{ justifyContent: 'end' }}>
						<Button onClick={onClose} variant="soft">
							Cancel
						</Button>
						<Button onClick={onSubmit} loading={isSubmitting}>
							Submit
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
