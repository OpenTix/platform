import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Button, SafeAreaView, View } from 'react-native';
import { useDynamic } from './DynamicSetup';
import EventView from './EventView';
import HomeScreen from './TicketListing';

const Stack = createNativeStackNavigator();

function HomeStack() {
	const client = useDynamic();
	return (
		<>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen
					name="Home"
					component={HomeScreen}
					options={{
						headerRight: () => (
							<SafeAreaView>
								<View
									style={{
										flex: 1,
										flexDirection: 'row',
										columnGap: 5
									}}
								>
									<Button
										title="Profile"
										onPress={() => {
											if (client?.auth?.token !== null) {
												client.ui.userProfile.show();
											}
										}}
									/>
									<Button
										title="Logout"
										onPress={() => {
											if (client?.auth?.token !== null) {
												client.auth.logout();
											}
										}}
									/>
								</View>
							</SafeAreaView>
						)
					}}
				/>
				<Stack.Screen
					name="Event"
					component={EventView}
					initialParams={{ Venue: undefined }}
					// @ts-expect-error This is valid code, but typescript doesn't like it
					options={({ route }) => ({ title: route?.params?.Name })}
				/>
			</Stack.Navigator>
		</>
	);
}

export default HomeStack;
