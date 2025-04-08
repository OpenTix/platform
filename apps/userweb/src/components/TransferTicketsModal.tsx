import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Button, Callout, Dialog, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ReturnedMetadata = {
	min: bigint;
	max: bigint;
	exists: boolean;
};

export interface TransferTicketsModalProps {
	onClose: () => void;
	TicketID: bigint;
}
export default function TransferTicketsModal({
	onClose,
	TicketID
}: TransferTicketsModalProps) {
	const navigate = useNavigate();
	const [showError, setShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { primaryWallet } = useDynamicContext();

	const onSubmit = async () => {
		setIsSubmitting(true);

		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					// const { request } = await p.simulateContract({
					// 	abi: ContractABI,
					// 	address: ContractAddress,
					// 	functionName: 'allow_ticket_to_be_transfered',
					// 	account: w.account,
					// 	args: [TicketID]
					// });
					// const hash = await w.writeContract(request);
					// console.log(hash);

					// // wait for the call to be included in a block
					// await p.waitForTransactionReceipt({
					// 	hash: hash
					// });

					setIsSubmitting(false);
					onClose();
					// navigate(0);
				} else {
					console.error('Wallet client or public client not set up');
					setErrorMessage(
						'Wallet client or public client not set up'
					);
					setShowError(true);
					setIsSubmitting(false);
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
				setErrorMessage('Error setting up wallet client');
				setShowError(true);
				setIsSubmitting(false);
			}
		}
	};

	return (
		<Dialog.Root open onOpenChange={onClose}>
			<Dialog.Content maxWidth="40vw">
				<Dialog.Title style={{ textAlign: 'center' }}>
					Buy Ticket
				</Dialog.Title>
				<Flex
					gap="1"
					direction="column"
					style={{ marginLeft: '10%', width: '80%' }}
				>
					{/* <Text>{Disclaimer}</Text> */}
					<Text>
						Pressing 'Purchase' will open your wallet provider.
					</Text>
					<Text>TicketID: {Number(TicketID)}</Text>

					{showError && errorMessage && (
						<Callout.Root color="red">
							<Callout.Icon>
								<CrossCircledIcon />
							</Callout.Icon>
							<Callout.Text>{errorMessage}</Callout.Text>
						</Callout.Root>
					)}
					<Flex gap="3" style={{ justifyContent: 'end' }}>
						<Button onClick={onClose} variant="soft">
							Cancel
						</Button>
						<Button onClick={onSubmit} loading={isSubmitting}>
							Purchase
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
