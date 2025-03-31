import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Button, StyleSheet, SafeAreaView } from 'react-native';
import { AddToWalletButton, openPaymentSetup } from 'react-native-add-wallet';
import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';
import QRCode from 'react-native-qrcode-svg';
import WalletManager from 'react-native-wallet-manager';

const TransferScreen = () => {
	const navigation = useNavigation();

	// useEffect(() => {
	// 	async function enableNfc() {
	// 		try {
	// 			await NfcManager.start();
	// 		} catch (e) {
	// 			console.warn("This device doesn't support NFC.", e);
	// 		}
	// 	}
	// 	enableNfc();

	// 	return () => {
	// 		NfcManager.cancelTechnologyRequest().catch(() => 0);
	// 	};
	// }, []);

	// async function readNdef() {
	// 	try {
	// 		await NfcManager.requestTechnology(NfcTech.Ndef);
	// 		const tag = await NfcManager.getTag();
	// 		console.warn('Tag found', tag);
	// 		if (tag.ndefMessage) {
	// 			const bytes = tag.ndefMessage[0].payload;
	// 			const text = Ndef.text.decodePayload(bytes);
	// 			alert(text);
	// 		} else {
	// 			alert('No NDEF message found');
	// 		}
	// 	} catch (ex) {
	// 		console.warn('Oops!', ex);
	// 	} finally {
	// 		NfcManager.cancelTechnologyRequest();
	// 	}
	// }

	const canAddPasses = async () => {
		try {
			const result = await WalletManager.canAddPasses();
			console.log(result);
		} catch (e) {
			console.log(e);
		}
	};

	const addPass = async () => {
		try {
			const result = await WalletManager.addPassFromUrl(
				'https://github.com/dev-family/react-native-wallet-manager/blob/main/example/resources/pass.pkpass?raw=true'
			);
			console.log(result);
		} catch (e) {
			console.log(e);
		}
	};

	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			<Image
				source={{
					uri: 'https://static.vecteezy.com/system/resources/thumbnails/001/218/694/small_2x/under-construction-warning-sign.jpg'
				}}
				style={{ width: 400, height: 400 }}
			/>

			{/* <Text>NFC Reader</Text>
			<Button title="Read NFC Tag" onPress={readNdef} /> */}
			{/* <AddToWalletButton onPress={openPaymentSetup} />
			<Button title="Check Wallet Access" onPress={canAddPasses} />
			<Button title="Test Add" onPress={addPass} /> */}
		</View>
	);
};

export default TransferScreen;
