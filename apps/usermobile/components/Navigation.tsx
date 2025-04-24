import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
	Button,
	Pressable,
	SafeAreaView,
	View,
	Text,
	useColorScheme,
	Platform
} from 'react-native';
import * as colors from '../constants/colors';
import { useDynamic } from './DynamicSetup';
import EventView from './EventView';
import HomeScreen from './TicketListing';

const Stack = createNativeStackNavigator();

function HomeStack() {
	const client = useDynamic();
	const is_dark = useColorScheme() === 'dark';
	const isIos = Platform.select({
		ios: true,
		android: false
	});

	return (
		<>
			<client.reactNative.WebView />
			<Stack.Navigator initialRouteName="Home">
				<Stack.Screen
					name="Home"
					component={HomeScreen}
					options={{
						headerTitle: 'Tickets',
						headerTitleAlign: 'left',
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
					name="Event"
					component={EventView}
					// @ts-expect-error This is valid code, but typescript doesn't like it
					options={({ route }) => ({ title: route?.params?.Name })}
				/>
			</Stack.Navigator>
		</>
	);
}

export default HomeStack;
