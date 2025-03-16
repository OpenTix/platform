import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventDetails from '../screens/EventDetails';
import Events from '../screens/Events';
import Home from '../screens/Home';

global.TextEncoder = require('text-encoding').TextEncoder;

const Stack = createNativeStackNavigator();

export default function App() {
	return (
		<NavigationContainer>
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen name="Home" component={Home} />
				<Stack.Screen
					name="Events"
					component={Events}
					initialParams={{ Venue: undefined }}
					options={({ route }) => ({ title: route?.params?.Name })}
				/>
				<Stack.Screen
					name="EventDetails"
					component={EventDetails}
					initialParams={{ Event: undefined }}
				/>
			</Stack.Navigator>
		</NavigationContainer>
	);
}
