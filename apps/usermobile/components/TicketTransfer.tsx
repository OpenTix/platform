import { ContractABI, ContractAddress } from '@platform/blockchain';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { View, Modal, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-paper';
import { isAddress } from 'viem';
import { polygonAmoy } from 'viem/chains';
import { useDynamic } from './DynamicSetup';

const TransferScreen = () => {
	const navigation = useNavigation();
	const client = useDynamic();
	const [intermediate, setIntermediate] = useState('');
	const [result, setResult] = useState<string>('');
	const [modalVisible, setModalVisible] = useState(false);
	const [playAnimation, setPlayAnimation] = useState(false);

	const navigateToQRCamera = () => {
		// @ts-expect-error This is valid code, but typescript doesn't like it
		navigation.navigate('QRCamera', {
			onGoBack: (data: string) => {
				setIntermediate(data);
			}
		});
	};

	const buyTicket = async () => {
		const vals = JSON.parse(intermediate);
		const address = vals['address'];
		const ticket = vals['id'];
		const basecost = vals['basecost'];

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

					setResult('Loading...');
					setModalVisible(true);
					setPlayAnimation(true);

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

	const handleAnimationFinish = () => {
		setTimeout(() => {
			setPlayAnimation(false);
			setModalVisible(false);
		}, 2000);
	};

	return (
		<>
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)} // For Android back button
			>
				<View style={styles.modalBackground}>
					{result === 'Loading...' && playAnimation && (
						<LottieView
							source={require('../assets/AnimationLoading.lottie')}
							style={{ width: '100%', height: '100%' }}
							autoPlay
							loop
						/>
					)}
					{(result === 'Success' || result === 'Failed') &&
						playAnimation && (
							<LottieView
								source={
									result === 'Success'
										? require('../assets/AnimationSuccess.lottie')
										: require('../assets/AnimationFail.lottie')
								}
								style={{ width: '100%', height: '100%' }}
								loop={false}
								autoPlay
								onAnimationFinish={handleAnimationFinish}
							/>
						)}
				</View>
			</Modal>
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center'
				}}
			>
				<Button onPress={navigateToQRCamera}>
					Click to buy ticket from user QR code
				</Button>
			</View>
		</>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalBackground: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)'
	},
	modalView: {
		margin: 20,
		padding: 35,
		backgroundColor: 'white',
		borderRadius: 10,
		alignItems: 'center'
	},
	modalText: {
		marginBottom: 15,
		fontSize: 18
	}
});

export default TransferScreen;
