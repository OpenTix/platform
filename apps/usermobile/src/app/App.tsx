import * as React from 'react';
import { StatusBar } from 'react-native';
import { View } from 'react-native';
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
		client.ui.auth.hide();
	});
	client.ui.on('authFlowCancelled', () => {
		console.log('User cancelled the flow not cool');
		client.ui.auth.show();
	});

	React.useEffect(() => {
		return;
	}, [client.auth.token]);

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
