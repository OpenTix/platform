import { Link } from 'expo-router';
import { View, Text, Button } from 'react-native';

const HomeScreen = () => {
	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			<Text>Home Screen</Text>
			<Link href="/Profile" asChild>
				<Button title="Go to Profile" />
			</Link>
		</View>
	);
};

export default HomeScreen;
