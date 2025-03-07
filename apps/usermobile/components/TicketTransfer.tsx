import { useNavigation } from '@react-navigation/native';
import { View, Text, Image } from 'react-native';

const TransferScreen = () => {
	const navigation = useNavigation();

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
		</View>
	);
};

export default TransferScreen;
