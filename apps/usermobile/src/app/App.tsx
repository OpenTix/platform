import { NavigationContainer } from '@react-navigation/native';
import React, { useState } from 'react';
import {
	SafeAreaView,
	ScrollView,
	View,
	Button,
	StatusBar
} from 'react-native';
import { dynamicClient } from '../../components/DynamicSetup';
import { Home } from '../../components/Home';

export default function App() {
	const [isLoggedIn, setisLoggedIn] = useState<boolean>(
		dynamicClient.auth.email ? true : false
	);

	dynamicClient.auth.on('authSuccess', (user) => {
		console.log('User logged in', user);
		setisLoggedIn(true);
	});

	const login = () => {
		dynamicClient.ui.auth.show();
	};

	return (
		<NavigationContainer>
			<View style={[{ backgroundColor: 'white' }, { flex: 1 }]}>
				<dynamicClient.reactNative.WebView />
				<StatusBar />
				<SafeAreaView>
					<ScrollView>
						{isLoggedIn ? (
							<>
								<Home onClose={() => setisLoggedIn(false)} />
							</>
						) : (
							<>
								<Button title="Login" onPress={() => login()} />
							</>
						)}
					</ScrollView>
				</SafeAreaView>
			</View>
		</NavigationContainer>
	);
}
