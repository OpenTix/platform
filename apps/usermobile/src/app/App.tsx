import FontAwesome from '@expo/vector-icons/FontAwesome';
import Octicons from '@expo/vector-icons/Octicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useDynamic } from '../../components/DynamicSetup';
import HomeStack from '../../components/Navigation';
import TransferStack from '../../components/TransferStack';

const Tab = createBottomTabNavigator();

export default function App() {
	const client = useDynamic();
	const [show, setShow] = useState(false);

	client.ui.on('authFlowCancelled', () => {
		if (!client.auth.authenticatedUser) {
			client.ui.auth.show();
		} else {
			client.ui.auth.hide();
		}
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
			}
		}
	};

	return (
		<NavigationContainer linking={deepLinking}>
			<Tab.Navigator screenOptions={{ headerShown: false }}>
				<Tab.Screen
					name="Tickets"
					component={HomeStack}
					options={{
						tabBarIcon: () => <FontAwesome name="home" size={18} />
					}}
				/>
				<Tab.Screen
					name="Transfer"
					component={TransferStack}
					options={{
						tabBarIcon: () => (
							<Octicons name="arrow-switch" size={18} />
						)
					}}
				/>
			</Tab.Navigator>
		</NavigationContainer>
	);
}
