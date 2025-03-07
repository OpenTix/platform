import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from 'react-native';
import { ScrollView } from 'react-native';
// import { getAuthToken } from '@dynamic-labs/react-native-extension'
import { useDynamic } from './DynamicSetup';

const ProfileScreen = () => {
	// const navigation = useNavigation();
	const client = useDynamic();

	// console.log(client.auth.token);

	return (
		<>
			<client.reactNative.WebView />
			<ScrollView>
				<View
					style={{
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					{client.auth.token != null ? (
						<Text>
							{JSON.stringify(
								client.auth.authenticatedUser,
								null,
								2
							)}
						</Text>
					) : (
						<Text>Loading...</Text>
					)}
					{/* <Button title="Login" onPress={() => promptLogin()} /> */}
				</View>
			</ScrollView>
		</>
	);
};

export default ProfileScreen;
