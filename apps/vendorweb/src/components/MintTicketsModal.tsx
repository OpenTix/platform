import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { getAuthToken, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { CrossCircledIcon } from '@radix-ui/react-icons';
import { Button, Callout, Dialog, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react';

export interface MintTicketsModalProps {
	onClose: () => void;
	passTransactionHash: (hash: string) => void;
	Basecost: number;
	NumGa: number;
	NumUnique: number;
	Title: string;
	EventDatetime: string;
	ID: string;
	Pk: number;
}
export default function MintTicketsModal({
	onClose,
	passTransactionHash,
	Basecost,
	NumGa,
	NumUnique,
	Title,
	EventDatetime,
	ID,
	Pk
}: MintTicketsModalProps) {
	const [showError, setShowError] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	const { primaryWallet } = useDynamicContext();

	const NFTMintingDescription = `${ID}`;

	const Disclaimer = `You are about to mint ${NumGa} General Admission tickets and ${NumUnique} Unique tickets for ${NFTMintingDescription}.`;

	const updateEventWithTransactionHash = async (hash: string) => {
		try {
			const authToken = getAuthToken();
			const res = await fetch(
				`${process.env.NX_PUBLIC_API_BASEURL}/vendor/events/`,
				{
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${authToken}`
					},
					body: JSON.stringify({
						Pk: Pk,
						TransactionHash: hash
					})
				}
			);
			if (!res.ok) {
				throw new Error('Failed to update event with transaction hash');
			}
		} catch (error) {
			console.error(error);
		}
	};

	const onSubmit = async () => {
		setIsSubmitting(true);

		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'create_new_event',
						account: w.account,
						args: [
							NFTMintingDescription,
							`https://opentix.co/event/${ID}`,
							NumUnique,
							NumGa,
							Array(NumGa + NumUnique).fill(Basecost)
						]
					});

					const hash = await w.writeContract(request);
					passTransactionHash(hash);
					await updateEventWithTransactionHash(hash);
					setIsSubmitting(false);
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
					Mint Tickets
				</Dialog.Title>
				<Flex
					gap="1"
					direction="column"
					style={{ marginLeft: '10%', width: '80%' }}
				>
					<Text>{Disclaimer}</Text>
					<Text>Pressing 'Mint' will open your wallet provider.</Text>
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
							Mint
						</Button>
					</Flex>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
}
