import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ContractABI, ContractAddress } from '@platform/blockchain';
import { Flex, Text } from '@radix-ui/themes';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { isAddress } from 'viem';

export default function PurchaseUserTicket() {
	const { primaryWallet } = useDynamicContext();
	const [result, setResult] = useState<string>('Loading...');
	const [params] = useSearchParams();
	const address = params.get('address') ?? '';
	const ticket = params.get('ticket') ?? '';
	const basecost = params.get('basecost') ?? '';

	const buyTicket = async () => {
		if (ticket === '' || address === '' || basecost === '') {
			setResult('Invalid parameters');
			return;
		}

		if (!isAddress(address)) {
			setResult('Invalid address');
			return;
		}

		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'buy_ticket_from_user',
						account: w.account,
						args: [address, BigInt(ticket)],
						value: BigInt(basecost)
					});

					const hash = await w.writeContract(request);
					console.log(hash);

					// wait for the call to be included in a block
					await p.waitForTransactionReceipt({
						hash: hash
					});

					setResult('Success');
				} else {
					console.error('Wallet client or public client not set up');
					setResult('Failed');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
				setResult('Failed');
			}
		}
	};

	useEffect(() => {
		buyTicket();
	}, [primaryWallet]);

	return (
		<Flex
			align="start"
			gap="4"
			style={{ marginTop: '10px' }}
			justify={'center'}
		>
			<Text>{result}</Text>
		</Flex>
	);
}
