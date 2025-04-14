import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDynamic } from './DynamicSetup';
import QRCamera from './QRCamera';
import TransferScreen from './TicketTransfer';

const Stack = createNativeStackNavigator();

function TransferStack() {
	const client = useDynamic();
	return (
		<>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Transfer">
				<Stack.Screen name="Transfer" component={TransferScreen} />
				<Stack.Screen name="QRCamera" component={QRCamera} />
			</Stack.Navigator>
		</>
	);
}

export default TransferStack;
