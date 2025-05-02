import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Button, Callout, Dialog, Flex, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface TransferTicketsModalProps {
	onClose: (showLoading: boolean) => void;
	onWaiting: () => void;
	TicketID: bigint;
}
export default function TransferTicketsModal({
	onClose,
	onWaiting,
	TicketID
}: TransferTicketsModalProps) {
	const [showError, setShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [ticketTransferable, setTicketTransferable] =
		useState<boolean>(false);

	const { primaryWallet } = useDynamicContext();

	// query the contract (not on network) for the event name for an id
	async function checkIfTicketIsTransferable(id: bigint) {
		// get the events description from the id
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			const p = await primaryWallet.getPublicClient();
			if (p) {
				const data = (await p.readContract({
					abi: ContractABI,
					address: ContractAddress,
					functionName: 'check_ticket_transferable',
					args: [id]
				})) as boolean;

				return data;
			} else {
				throw new Error('Failed to create public client.');
			}
		} else {
			throw new Error('Failed to confirm ethereum wallet.');
		}
	}

	async function start() {
		setTicketTransferable(await checkIfTicketIsTransferable(TicketID));
	}

	useEffect(() => {
		start();
	});

	const onSubmit = async (allow: boolean) => {
		setIsSubmitting(true);

		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: allow
							? 'allow_ticket_to_be_transfered'
							: 'disallow_ticket_to_be_transfered',
						account: w.account,
						args: [TicketID]
					});
					const hash = await w.writeContract(request);
					console.log(hash);

					// wait for the call to be included in a block
					onWaiting();
					await p.waitForTransactionReceipt({
						hash: hash
					});

					setIsSubmitting(false);
					if (allow) {
						onClose(true);
					} else {
						onClose(false);
					}
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
					Transfer Ticket {Number(TicketID)}
				</Dialog.Title>
				<Flex
					gap="1"
					direction="column"
					style={{ marginLeft: '10%', width: '80%' }}
				>
					<Text>
						Pressing 'Allow Transfer' will open your wallet provider
						and make your ticket purchasable by other users.
					</Text>
					<Text>Pressing 'Show QR' will show the QR code again.</Text>

					{showError && errorMessage && (
						<Callout.Root color="red">
							<Callout.Icon>
								<CrossCircledIcon />
							</Callout.Icon>
							<Callout.Text>{errorMessage}</Callout.Text>
						</Callout.Root>
					)}
					<Flex gap="3" style={{ justifyContent: 'end' }}>
						<Button onClick={() => onClose(false)} variant="soft">
							Cancel
						</Button>
						<Button onClick={() => onClose(true)} variant="soft">
							Show QR
						</Button>
						{ticketTransferable ? (
							<Button
								onClick={() => onSubmit(false)}
								loading={isSubmitting}
							>
								Disallow Transfer
							</Button>
						) : (
							<Button
								onClick={() => onSubmit(true)}
								loading={isSubmitting}
							>
								Allow Transfer
							</Button>
						)}
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
