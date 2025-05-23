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

export interface BuyTicketsModalProps {
	onClose: () => void;
	passTransactionHash: (hash: string) => void;
	Title: string;
	EventDatetime: string;
	ID: string;
	TicketID: bigint;
	BaseCost: number;
}
export default function BuyTicketsModal({
	onClose,
	passTransactionHash,
	Title,
	EventDatetime,
	ID,
	TicketID,
	BaseCost
}: BuyTicketsModalProps) {
	const navigate = useNavigate();
	const [showError, setShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { primaryWallet } = useDynamicContext();

	const NFTMintingDescription = `${ID}`;

	const Disclaimer = `You are about to buy a ticket for ${NFTMintingDescription}.`;

	const getTicketID = async (
		description: string
	): Promise<Array<bigint> | undefined> => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = (await p.readContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'get_event_ids',
						args: [description]
					})) as [bigint[], ReturnedMetadata];

					return data[0] as Array<bigint>;
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

		const valid_TicketIDs = await getTicketID(NFTMintingDescription);

		// check that the ticket id is valid
		if (!valid_TicketIDs?.includes(TicketID)) {
			console.log(`${TicketID} is not a valid TicketID.`);
			throw Error;
		}

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
						value: BigInt(BaseCost)
					});
					const hash = await w.writeContract(request);
					console.log(hash);
					setIsSubmitting(false);
					passTransactionHash(hash);
					onClose();
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
