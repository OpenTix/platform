import FontAwesome from '@expo/vector-icons/FontAwesome';
import Octicons from '@expo/vector-icons/Octicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, LightTheme } from '@react-navigation/native';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useDynamic } from '../../components/DynamicSetup';
import HomeStack from '../../components/Navigation';
import TransferStack from '../../components/TransferStack';
import * as colors from '../../constants/colors';

const Tab = createBottomTabNavigator();

export default function App() {
	const client = useDynamic();
	const [show, setShow] = useState(false);
	const is_dark = useColorScheme() === 'dark';
	console.log(useColorScheme());
	console.log(`isdark ${is_dark}`);
	const DarkTheme = {
		colors: {
			background: colors.darkBackground,
			border: 'rgb(0, 0, 0)',
			card: 'rgb(0, 0, 0)',
			notification: 'rgb(255, 255, 255)',
			primary: 'rgb(255, 255, 255)',
			text: 'rgb(229, 229, 231)'
		},
		dark: true,
		fonts: {
			bold: { fontFamily: 'sans-serif', fontWeight: '600' },
			heavy: { fontFamily: 'sans-serif', fontWeight: '700' },
			medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
			regular: { fontFamily: 'sans-serif', fontWeight: 'normal' }
		}
	};

	client.ui.on('authFlowCancelled', () => {
		if (!client.auth.authenticatedUser) {
			client.ui.auth.show();
		} else {
			client.ui.auth.hide();
		}
	});

	useEffect(() => {
		if (!show) return;
		if (client.auth.authenticatedUser) {
			client.ui.auth.hide();
		} else {
			client.ui.auth.show();
		}
	}, [show, client.auth.authenticatedUser]);

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
		<NavigationContainer
			linking={deepLinking}
			theme={is_dark ? DarkTheme : LightTheme}
		>
			<Tab.Navigator screenOptions={{ headerShown: false }}>
				<Tab.Screen
					name="Tickets"
					component={HomeStack}
					options={{
						tabBarIcon: () => (
							<FontAwesome
								name="home"
								size={18}
								color={
									is_dark ? colors.darkText : colors.lightText
								}
							/>
						)
					}}
				/>
				<Tab.Screen
					name="Transfer"
					component={TransferStack}
					options={{
						tabBarIcon: () => (
							<Octicons
								name="arrow-switch"
								size={18}
								color={
									is_dark ? colors.darkText : colors.lightText
								}
							/>
						)
					}}
				/>
			</Tab.Navigator>
		</NavigationContainer>
	);
}
