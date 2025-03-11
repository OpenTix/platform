import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStaticNavigation } from '@react-navigation/native';
import { Button } from 'react-native';
import { dynamicClient } from './DynamicSetup';
import ProfileScreen from './Profile';
import HomeScreen from './TicketListing';
import TransferScreen from './TicketTransfer';

const logUserOut = () => {
	console.log('LOGGED OUT');
	dynamicClient.auth.logout();
};

const showProfile = () => {
	console.log('showing profile');
	dynamicClient.ui.userProfile.show();
};

const MyTabs = createBottomTabNavigator({
	screens: {
		Tickets: HomeScreen,
		Transfer: TransferScreen,
		Profile: ProfileScreen
	},
	screenOptions: {
		headerRight: () => (
			// <TouchableOpacity>
			// 	{
			// 	<Avatar.Icon size={30} icon="login" />
			//     }
			// </TouchableOpacity>
			<Button title="logout" onPress={logUserOut} />
		),
		headerLeft: () => <Button title="profile" onPress={showProfile} />
	},
	initialRouteName: 'Tickets'
});

const Navigation = createStaticNavigation(MyTabs);

export default Navigation;
