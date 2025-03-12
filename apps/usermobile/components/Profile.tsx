import { View, Text } from 'react-native';
import { ScrollView } from 'react-native';
import { useDynamic } from './DynamicSetup';

const ProfileScreen = () => {
	const client = useDynamic();

	return (
		<>
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
				</View>
			</ScrollView>
		</>
	);
};

export default ProfileScreen;
