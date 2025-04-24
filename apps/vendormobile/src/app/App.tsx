import { NavigationContainer, LightTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
	Text,
	Pressable,
	SafeAreaView,
	View,
	useColorScheme,
	Button,
	Platform
} from 'react-native';
import * as colors from '../constants/colors';
import { useDynamic } from '../hooks/DynamicSetup';
import EventDetails from '../screens/EventDetails';
import Events from '../screens/Events';
import Home from '../screens/Home';
import QRCamera from '../screens/QRCamera';

global.TextEncoder = require('text-encoding').TextEncoder;

const Stack = createNativeStackNavigator();

export default function App() {
	const is_dark = useColorScheme() === 'dark';
	const isIos = Platform.select({
		ios: true,
		android: false
	});
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
		<NavigationContainer
			linking={deepLinking}
			theme={is_dark ? DarkTheme : LightTheme}
		>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen
					name="Home"
					component={Home}
					options={{
						headerLeft: () => (
							<SafeAreaView>
								{isIos && (
									<Button
										title="Profile"
										onPress={() => {
											if (client?.auth?.token !== null) {
												client.ui.userProfile.show();
											}
										}}
									/>
								)}
							</SafeAreaView>
						),
						headerRight: () => (
							<SafeAreaView>
								<View
									style={{
										flex: 1,
										flexDirection: 'row',
										columnGap: 5
									}}
								>
									{isIos ? (
										<Button
											title="Logout"
											onPress={() => {
												if (
													client?.auth?.token !== null
												) {
													client.auth.logout();
												}
											}}
										/>
									) : (
										<>
											<Pressable
												style={{
													backgroundColor: is_dark
														? colors.darkPrimary
														: colors.lightPrimary,
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
													if (
														client?.auth?.token !==
														null
													) {
														client.ui.userProfile.show();
													}
												}}
											>
												<Text
													style={{
														color: is_dark
															? colors.darkSecondary
															: colors.lightSecondary,
														textAlign: 'center'
													}}
												>
													Profile
												</Text>
											</Pressable>
											<Pressable
												style={{
													backgroundColor: is_dark
														? colors.darkPrimary
														: colors.lightPrimary,
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
													if (
														client?.auth?.token !==
														null
													) {
														client.auth.logout();
													}
												}}
											>
												<Text
													style={{
														color: is_dark
															? colors.darkSecondary
															: colors.lightSecondary,
														textAlign: 'center'
													}}
												>
													Logout
												</Text>
											</Pressable>
										</>
									)}
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
