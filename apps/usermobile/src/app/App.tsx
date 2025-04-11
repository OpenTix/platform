import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
// import Navigation from '../../components/Navigation';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StatusBar } from 'react-native';
import { View, Button } from 'react-native';
import { Text } from 'react-native';
import { useDynamic } from '../../components/DynamicSetup';
import EventView from '../../components/EventView';
import HomeStack from '../../components/Navigation';
import HomeScreen from '../../components/TicketListing';
import TransferScreen from '../../components/TicketTransfer';

const Tab = createBottomTabNavigator();

export default function App() {
	const client = useDynamic();
	const [show, setShow] = useState(false);

	client.auth.on('authFailed', () => {
		console.log('User failed to login');
		client.ui.auth.show();
	});
	client.auth.on('authSuccess', (user) => {
		console.log('User logged in', user);
		client.ui.auth.hide();
	});
	client.ui.on('authFlowCancelled', () => {
		console.log('User cancelled the flow not cool');
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
		setTimeout(() => setShow(true), 1500);
	}, [setShow]);

	const deepLinking = {
		prefixes: ['opentixusermobile://'],
		config: {
			initialRouteName: 'Home',
			screens: {
				Home: 'HomeScreen'
				// Events: 'Event',
				// EventDetails: 'EventDetails'
			}
		}
	};

	return (
		<NavigationContainer linking={deepLinking}>
			<Tab.Navigator screenOptions={{ headerShown: false }}>
				<Tab.Screen name="Tickets" component={HomeStack} />
				<Tab.Screen name="Transfer" component={TransferScreen} />
			</Tab.Navigator>
		</NavigationContainer>
	);
}
