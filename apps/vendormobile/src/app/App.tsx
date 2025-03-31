import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { useDynamic } from '../hooks/DynamicSetup';
import EventDetails from '../screens/EventDetails';
import Events from '../screens/Events';
import Home from '../screens/Home';
import QRCamera from '../screens/QRCamera';

global.TextEncoder = require('text-encoding').TextEncoder;

const Stack = createNativeStackNavigator();

export default function App() {
	const client = useDynamic();

	// if (client.auth.token === null) client.ui.auth.show();

	client.auth.on('authFailed', () => {
		console.log('User failed to login');
	});
	client.auth.on('authSuccess', (user) => {
		console.log('User logged in', user);
	});
	client.ui.on('authFlowCancelled', () => {
		console.log('User cancelled the flow not cool');
		client.ui.auth.show();
	});

	useEffect(() => {
		if (client.auth.token != null) {
			client.ui.auth.hide();
		} else {
			client.ui.auth.show();
		}
	}, [client.auth.token]);

	return (
		<NavigationContainer>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen name="Home" component={Home} />
				<Stack.Screen
					name="Events"
					// @ts-expect-error This is valid code, but typescript doesn't like it
					component={Events}
					initialParams={{ Venue: undefined }}
					// @ts-expect-error This is valid code, but typescript doesn't like it
					options={({ route }) => ({ title: route?.params?.Name })}
				/>
				<Stack.Screen
					name="EventDetails"
					// @ts-expect-error This is valid code, but typescript doesn't like it
					component={EventDetails}
					initialParams={{ Event: undefined }}
				/>
				<Stack.Screen name="QRCamera" component={QRCamera} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}
