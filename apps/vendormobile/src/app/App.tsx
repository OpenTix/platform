import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Text, Pressable, SafeAreaView, View } from 'react-native';
import { useDynamic } from '../hooks/DynamicSetup';
import EventDetails from '../screens/EventDetails';
import Events from '../screens/Events';
import Home from '../screens/Home';
import QRCamera from '../screens/QRCamera';

global.TextEncoder = require('text-encoding').TextEncoder;

const Stack = createNativeStackNavigator();

export default function App() {
	const client = useDynamic();
	const [show, setShow] = useState(false);

	client.auth.on('authFailed', () => {
		client.ui.auth.show();
	});
	client.auth.on('authSuccess', () => {
		client.ui.auth.hide();
	});
	client.ui.on('authFlowCancelled', () => {
		client.ui.auth.show();
	});
	client.auth.on('loggedOut', () => {
		client.ui.auth.show();
	});

	useEffect(() => {
		if (!show) return;
		if (client.auth.token !== null) {
			client.ui.auth.hide();
		} else {
			client.ui.auth.show();
		}
	}, [show]);

	useEffect(() => {
		setTimeout(() => setShow(true), 3000);
	}, [setShow]);

	const deepLinking = {
		prefixes: ['opentixvendormobile://'],
		config: {
			initialRouteName: 'Home',
			screens: {
				Home: 'Home',
				Events: 'Events',
				EventDetails: 'EventDetails'
			}
		}
	};

	return (
		<NavigationContainer linking={deepLinking}>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen
					name="Home"
					component={Home}
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
									<Pressable
										style={{
											backgroundColor: 'white',
											borderRadius: 20, // Make it round
											padding: 7,
											elevation: 5, // Shadow for Android
											shadowColor: '#000', // Shadow for iOS
											shadowOffset: {
												width: 0,
												height: 2
											},
											shadowOpacity: 0.3,
											shadowRadius: 3,
											alignItems: 'center',
											justifyContent: 'center'
										}}
										onPressOut={() => {
											if (client?.auth?.token !== null) {
												client.ui.userProfile.show();
											}
										}}
									>
										<Text>Profile</Text>
									</Pressable>
									<Pressable
										style={{
											backgroundColor: 'white',
											borderRadius: 20, // Make it round
											padding: 7,
											elevation: 5, // Shadow for Android
											shadowColor: '#000', // Shadow for iOS
											shadowOffset: {
												width: 0,
												height: 2
											},
											shadowOpacity: 0.3,
											shadowRadius: 3,
											alignItems: 'center',
											justifyContent: 'center'
										}}
										onPressOut={() => {
											if (client?.auth?.token !== null) {
												client.auth.logout();
											}
										}}
									>
										<Text>Logout</Text>
									</Pressable>
								</View>
							</SafeAreaView>
						)
					}}
				/>
				<Stack.Screen
					name="Events"
					component={Events}
					initialParams={{ Venue: undefined }}
					// @ts-expect-error This is valid code, but typescript doesn't like it
					options={({ route }) => ({ title: route?.params?.Name })}
				/>
				<Stack.Screen
					name="EventDetails"
					component={EventDetails}
					initialParams={{ Event: undefined }}
				/>
				<Stack.Screen name="QRCamera" component={QRCamera} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
