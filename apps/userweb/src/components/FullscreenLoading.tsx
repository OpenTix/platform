import { Dialog, Box, Button } from '@radix-ui/themes';
import QRCode from 'react-qr-code';

export interface FullscreenLoadingProps {
	onClose: () => void;
	message: string;
}
export const FullscreenLoading = ({
	onClose,
	message
}: FullscreenLoadingProps) => {
	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="40vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					Send the purchaser this QR code
				</Dialog.Title>
				<Box style={{ textAlign: 'center' }}>
					<QRCode
						style={{ textAlign: 'center' }}
						value={`${message}`}
					/>
				</Box>
				<Box style={{ textAlign: 'center' }}>
					<Button onClick={onClose}>Close</Button>
				</Box>
			</Dialog.Content>
		</Dialog.Root>
	);
};
