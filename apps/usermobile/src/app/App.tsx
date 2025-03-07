// import { NavigationContainer } from '@react-navigation/native';
import {
	createStaticNavigation,
	NavigationContainer
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { StatusBar } from 'react-native';
// import { dynamicClient } from '../../components/DynamicSetup';
// import { Home } from '../../components/Home';
// import ScreenLayout from '../../components/ScreenLayout';
// import Stack from '../../components/Stack';
import { View } from 'react-native';
// import { useLinkBuilder, useTheme } from '@react-navigation/native';
// import { Text, PlatformPressable } from '@react-navigation/elements';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useDynamic } from '../../components/DynamicSetup';
import Navigation from '../../components/Navigation';

export default function App() {
	const client = useDynamic();

	if (client.auth.token === null) client.ui.auth.show();

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

	return (
		<>
			<View style={[{ backgroundColor: 'white' }, { flex: 1 }]}>
				<client.reactNative.WebView />
				<StatusBar
					backgroundColor={'white'}
					barStyle={'dark-content'}
					translucent={false}
					hidden={false}
				/>
				{client.auth.token != null ? <Navigation /> : <Text></Text>}
			</View>
		</>
	);
}
