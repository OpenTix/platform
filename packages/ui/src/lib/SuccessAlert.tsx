import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Callout } from '@radix-ui/themes';

export interface SuccessAlertProps {
	message: string;
}

export function SuccessAlert({ message }: SuccessAlertProps) {
	return (
		<Callout.Root color="green">
			<Callout.Icon>
				<InfoCircledIcon />
			</Callout.Icon>
			<Callout.Text>{message}</Callout.Text>
		</Callout.Root>
	);
}
