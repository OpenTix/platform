import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractABI, ContractAddress } from '@platform/blockchain';
import { Badge, DataList, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

type ReturnedMetadata = {
	min: bigint;
	max: bigint;
	exists: boolean;
};

export interface ListOfNFTsForEventProps {
	Title: string;
	EventDatetime: string;
	ID: string;
	setTicketId: (num: bigint) => void;
	setShouldShowBuyModal: (bool: boolean) => void;
}

export default function ListOfNFTsForEvent({
	Title,
	EventDatetime,
	ID,
	setTicketId,
	setShouldShowBuyModal
}: ListOfNFTsForEventProps) {
	const NFTMintingDescription = `${ID}`;
	const { primaryWallet } = useDynamicContext();
	const [NFTs, setNFTs] = useState<bigint[]>([]);
	const [metadata, setMetadata] = useState<ReturnedMetadata>();

	const GetNFTs = async () => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = (await p.readContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'get_event_ids',
						args: [NFTMintingDescription]
					})) as [bigint[], ReturnedMetadata];

					setNFTs(data[0] as bigint[]);
					setMetadata(data[1]);
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
	};

	useEffect(() => {
		GetNFTs();
	}, []);

	return (
		<div>
			{primaryWallet && NFTs.length === 0 && (
				<Text>There are no tickets created for this event yet.</Text>
			)}
			{!primaryWallet && (
				<Text>
					You are not logged in, please log in to view tickets.
				</Text>
			)}
			{NFTs.length > 0 && (
				<DataList.Root>
					{metadata &&
						Array.from(
							{
								length: Number(
									metadata.max - metadata.min + BigInt(1)
								)
							},
							(_, index) => {
								const current = metadata.min + BigInt(index);
								return (
									<DataList.Item key={current.toString()}>
										<DataList.Label>
											{ContractAddress}:
											{current.toString()}
										</DataList.Label>
										<DataList.Value>
											{NFTs.includes(current) ? (
												<Badge color="green">
													Available
												</Badge>
											) : (
												<Badge color="crimson">
													Sold
												</Badge>
											)}
											{NFTs.includes(current) && (
												<Badge
													style={{
														cursor: 'pointer',
														marginLeft: '1em'
													}}
													color="sky"
													variant="surface"
													onClick={() => {
														setTicketId(current);
														setShouldShowBuyModal(
															true
														);
													}}
												>
													Buy Now
												</Badge>
											)}
										</DataList.Value>
									</DataList.Item>
								);
							}
						)}
				</DataList.Root>
			)}
		</div>
	);
}
