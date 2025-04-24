import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, CameraView } from 'expo-camera';
import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

export default function QRCamera({
	route
}: NativeStackScreenProps<'QRCamera'>) {
	const navigation = useNavigation();
	const [hasPermission, setHasPermission] = useState<boolean>(false);
	let scanned = false;
	let qrDatainternal = '';

	const handleGoBack = () => {
		// Pass data back to Event Deatails Screen using the onGoBack callback
		route.params.onGoBack(qrDatainternal);
		navigation.goBack();
	};

	useEffect(() => {
		const getCameraPermissions = async () => {
			const { status } = await Camera.requestCameraPermissionsAsync();
			setHasPermission(status === 'granted');
		};

		getCameraPermissions();
	}, []);

	// @ts-expect-error This is valid code, but typescript doesn't like it
	const handleBarcodeScanned = ({ type, data }) => {
		if (scanned) return;
		scanned = true;
		qrDatainternal = data;
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
