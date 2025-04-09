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
	const vals = JSON.parse(message);
	const address = vals['address'];
	const ticket = vals['id'];
	const basecost = vals['basecost'];

	const copyToClipboard = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch (err) {
			console.error('Failed to copy text: ', err);
			return false;
		}
	};

	const createLink = async () => {
		return `${window.location.protocol}//${window.location.host}/buyUserTicket?address=${address}&ticket=${ticket}&basecost=${basecost}`;
	};

	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="40vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					Scan the QR code with our mobile app or use the link
				</Dialog.Title>
				<Box style={{ textAlign: 'center' }}>
					<QRCode
						style={{ textAlign: 'center' }}
						value={`${message}`}
					/>
				</Box>
				<Box style={{ textAlign: 'center' }}>
					<Button
						variant="soft"
						onClick={async () =>
							copyToClipboard(await createLink())
						}
					>
						Copy Link
					</Button>
				</Box>
				<Box style={{ textAlign: 'center' }}>
					<Button onClick={onClose}>Close</Button>
				</Box>
			</Dialog.Content>
		</Dialog.Root>
	);
};
