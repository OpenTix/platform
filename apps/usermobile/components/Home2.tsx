import { useNavigation } from '@react-navigation/native';
import { View, Text, Button } from 'react-native';

const HomeScreen = () => {
	// const navigation = useNavigation();

	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			{/* <Text>Home Screen</Text> */}
			{/* <Button title="Go to Profile" onPress={() => navigation.navigate("Profile" as never)}/> */}
		</View>
	);
};

export default HomeScreen;
