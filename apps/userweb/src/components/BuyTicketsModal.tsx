import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Button, Callout, Dialog, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface BuyTicketsModalProps {
	onClose: () => void;
	// Basecost: number;
	// NumGa: number;
	// NumUnique: number;
	Title: string;
	EventDatetime: string;
	ID: string;
}
export default function BuyTicketsModal({
	onClose,
	Title,
	EventDatetime,
	ID
}: BuyTicketsModalProps) {
	const navigate = useNavigate();
	const [showError, setShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { primaryWallet } = useDynamicContext();

	const NFTMintingDescription = `${Title} at ${EventDatetime} - ${ID}`;

	const Disclaimer = `You are about to buy a ticket for ${NFTMintingDescription}.`;

	const getTicketID = async (
		description: string
	): Promise<Array<bigint> | undefined> => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = await p.readContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'get_event_ids',
						args: [description]
					});
					// console.log(data);
					return (data as Array<any>)[0] as Array<bigint>;
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
	};

	const onSubmit = async () => {
		setIsSubmitting(true);

		const TicketIDarr = await getTicketID(NFTMintingDescription);

		if (TicketIDarr === undefined) {
			throw Error;
		}

		const TicketID = TicketIDarr[0];
		console.log(`TicketID = ${TicketID}`);

		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'buy_tickets',
						account: w.account,
						args: [NFTMintingDescription, [TicketID]],
						value: BigInt(1000000000000000)
					});
					console.log(`request = ${request}`);
					const hash = await w.writeContract(request);
					console.log(hash);
					// await updateEventWithTransactionHash(hash);
					setIsSubmitting(false);
					onClose();
					navigate(0);
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
					<Text>{Disclaimer}</Text>
					<Text>
						Pressing 'Purchase' will open your wallet provider.
					</Text>

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
