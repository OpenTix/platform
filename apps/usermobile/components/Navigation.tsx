import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, PlatformPressable } from '@react-navigation/elements';
import {
	createStaticNavigation,
	useNavigation,
	useLinkBuilder,
	useTheme
} from '@react-navigation/native';
import { View, Platform, Button } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Touchable } from 'react-native';
import { Avatar } from 'react-native-paper';
import { dynamicClient } from './DynamicSetup';
import HomeScreen from './Home2';
import ProfileScreen from './Profile';
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
