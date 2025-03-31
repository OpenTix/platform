import { useNavigation } from '@react-navigation/native';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useDynamic } from '../hooks/DynamicSetup';

// @ts-expect-error This is valid code, but typescript doesn't like it
export default function QRCamera({ route }) {
	const navigation = useNavigation();
	const client = useDynamic();
	const [hasPermission, setHasPermission] = useState(null);
	let scanned = false;
	// const [qrDatainternal, setqrDatainternal] = useState('');
	let qrDatainternal = '';

	const handleGoBack = () => {
		// Pass data back to ScreenA using the onGoBack callback
		console.log(qrDatainternal);
		route.params.onGoBack(qrDatainternal);
		navigation.goBack();
	};

	useEffect(() => {
		const getCameraPermissions = async () => {
			const { status } = await Camera.requestCameraPermissionsAsync();
			console.log(`status = ${status}`);
			// @ts-expect-error This is valid code, but typescript doesn't like it
			setHasPermission(status === 'granted');
		};

		getCameraPermissions();
	}, []);

	// @ts-expect-error This is valid code, but typescript doesn't like it
	const handleBarcodeScanned = ({ type, data }) => {
		if (scanned) return;
		console.log(scanned);
		scanned = true;
		qrDatainternal = data;
		console.log(`qrdatainternal ${type} ${qrDatainternal}`);
		handleGoBack();
	};

	return (
		<View style={{ flex: 1 }}>
			<CameraView
				onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
				barcodeScannerSettings={{
					barcodeTypes: ['qr', 'pdf417']
				}}
				style={StyleSheet.absoluteFillObject}
			/>
			{/* <Button title="Go Back" onPress={handleGoBack} /> */}
		</View>
	);
}
