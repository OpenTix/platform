import HomeScreen from './Home2';
import ProfileScreen from './Profile';
import Stack from './Stack';

function ScreenLayout() {
	return (
		<Stack.Navigator>
			<Stack.Screen name="Home" component={HomeScreen} />
			<Stack.Screen name="Profile" component={ProfileScreen} />
		</Stack.Navigator>
	);
}

export default ScreenLayout;
