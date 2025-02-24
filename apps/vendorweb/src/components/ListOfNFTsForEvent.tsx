import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractABI, ContractAddress } from '@platform/blockchain';
import { useEffect, useState } from 'react';

export interface ListOfNFTsForEventProps {
	Title: string;
	EventDatetime: string;
	ID: string;
}

export default function ListOfNFTsForEvent({
	Title,
	EventDatetime,
	ID
}: ListOfNFTsForEventProps) {
	const NFTMintingDescription = `${Title} at ${EventDatetime} - ${ID}`;
	const { primaryWallet } = useDynamicContext();
	const [NFTs, setNFTs] = useState<bigint[]>([]);

	const GetNFTs = async () => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = await p.readContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'get_event_ids',
						args: [NFTMintingDescription]
					});
					setNFTs(data as bigint[]);
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
			{NFTs.length > 0 && (
				<div>
					<ul>
						{NFTs.map((nft, index) => (
							<li key={index}>
								{ContractAddress}:{nft.toString()}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
