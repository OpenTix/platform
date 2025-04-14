import { ContractABI, ContractAddress } from '@platform/blockchain';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { isAddress } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { useDynamic } from './DynamicSetup';

const TransferScreen = () => {
	const navigation = useNavigation();
	const client = useDynamic();
	const [intermediate, setIntermediate] = useState('');
	const [result, setResult] = useState<string>('');

	const navigateToQRCamera = () => {
		navigation.navigate('QRCamera', {
			onGoBack: (data: string) => {
				setIntermediate(data);
				console.log(`QR DATA ${data}`);
			}
		});
	};

	const buyTicket = async () => {
		const vals = JSON.parse(intermediate);
		const address = vals['address'];
		const ticket = vals['id'];
		const basecost = vals['basecost'];

		setResult('Loading...');

		if (ticket === '' || address === '' || basecost === '') {
			setResult('Invalid parameters');
			return;
		}

		if (!isAddress(address)) {
			setResult('Invalid address');
			return;
		}

		if (client.wallets.primary) {
			try {
				const w = await client.viem.createWalletClient({
					wallet: client.wallets.primary
				});
				const p = await client.viem.createPublicClient({
					chain: polygonAmoy
				});

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
		if (intermediate !== '') {
			buyTicket();
		}
	}, [intermediate]);

	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			<Text>Here is where you buy a ticket from another user.</Text>

			<Text>{intermediate}</Text>

			<Text>Result: {result}</Text>

			<Button onPress={navigateToQRCamera}>
				Click to buy ticket from user QR code
			</Button>
		</View>
	);
};

export default TransferScreen;
