import AntDesign from '@expo/vector-icons/AntDesign';
import { Event } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useCallback, useState, useRef } from 'react';
import {
	ScrollView,
	Text,
	View,
	Image,
	RefreshControl,
	useColorScheme,
	LayoutChangeEvent
} from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import * as colors from '../constants/colors';
import { useDynamic } from '../hooks/DynamicSetup';

type Params = { Events: { Venue: number; Name: string } };

export default function Events({
	route
}: NativeStackScreenProps<Params, 'Events'>) {
	const is_dark = useColorScheme() === 'dark';
	const { Venue } = route.params;
	const VenueName = route.params.Name;
	const navigation = useNavigation();
	const client = useDynamic();

	const [events, setEvents] = useState<Event[]>([]);
	const [timeoutDone, setTimeoutDone] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [shouldFetch, setShouldFetch] = useState<boolean>(true);

	const [cardHeights, setCardHeights] = useState<Record<string, number>>({});

	const handleLayout = (index: number, layoutEvent: LayoutChangeEvent) => {
		const { height } = layoutEvent.nativeEvent.layout;
		setCardHeights((prev) => ({ ...prev, [index]: height }));
	};

	// handle scroll up page refresh
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		setShouldFetch(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 1000);
	}, []);

	const getEvents = useCallback(async () => {
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/vendor/events?Venue=${Venue}&EventDatetime=${new Date().toISOString()}`,
			{ headers: { Authorization: `Bearer ${client.auth.token}` } }
		);
		const data = await resp.json();
		setShouldFetch(false);

		setEvents(data);
	}, []);

	useEffect(() => {
		setTimeoutDone(false);
		if (shouldFetch) getEvents();
		setTimeout(() => setTimeoutDone(true), 2000);
	}, [shouldFetch]);

	return (
		<View
			style={{
				backgroundColor: is_dark
					? colors.darkBackground
					: colors.lightBackground,
				height: '100%',
				justifyContent: 'center',
				alignContent: 'center'
			}}
		>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
					/>
				}
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: 'center',
					paddingBottom: 10,
					paddingTop: 10
				}}
			>
				{events && events.length > 0 ? (
					<View
						style={{
							alignItems: 'center',
							display: 'flex',
							flexDirection: 'column',
							rowGap: 10,
							justifyContent: 'center'
						}}
					>
						{events.map((event: Event, idx: number) => {
							const date = new Date(event.EventDatetime);
							const month = date.toLocaleString('default', {
								month: 'short'
							});
							const day = date.getDate();
							const dayOfWeek = date.toLocaleString('default', {
								weekday: 'short'
							});
							const time = date.toLocaleString('default', {
								hour: 'numeric',
								minute: '2-digit',
								hour12: true
							});
							const displayDate = `${dayOfWeek} ${month} ${day}, ${date.getFullYear()} ${time}`;

							const leftComponent = () => (
								<Image
									source={{
										uri:
											event.Photo ??
											'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
									}}
									key={'Photo'}
									style={{
										height: cardHeights[idx] || 90,
										aspectRatio: 1,
										borderTopLeftRadius: 10,
										borderBottomLeftRadius: 10
									}}
								/>
							);

							const rightComponent = ({
								size
							}: {
								size: number;
							}) => (
								<AntDesign
									name="right"
									size={size}
									color={
										is_dark
											? colors.darkSecondary
											: colors.lightSecondary
									}
								/>
							);

							const subtitle = (
								<View>
									<Text
										style={{
											color: is_dark
												? colors.darkSecondary
												: colors.lightSecondary,
											textAlign: 'center',
											textAlignVertical: 'center'
										}}
									>
										{event.Type}
									</Text>
									<Text
										style={{
											color: is_dark
												? colors.darkSecondary
												: colors.lightSecondary,
											textAlign: 'center',
											textAlignVertical: 'center'
										}}
									>
										{displayDate}
									</Text>
								</View>
							);

							return (
								<Card
									onLayout={(e) => handleLayout(idx, e)}
									style={{
										minWidth: '90%',
										maxWidth: '90%',
										justifyContent: 'center',
										backgroundColor: is_dark
											? colors.darkPrimary
											: colors.lightPrimary,
										marginRight: 5,
										marginVertical: 5,
										paddingVertical: 10,
										elevation: 5,
										shadowColor: '#000', // Shadow for iOS
										shadowOffset: { width: 0, height: 2 },
										shadowOpacity: 0.4,
										shadowRadius: 6
									}}
									key={idx}
									onPress={() => {
										navigation.navigate('EventDetails', {
											Event: event.ID
										});
									}}
								>
									<Card.Title
										style={{
											paddingLeft: 0, // This removes internal padding in the Card.Title
											marginLeft: 0 // This ensures the component aligns with the edge
										}}
										title={
											event.Name.length > 25
												? event.Name.slice(0, 22) +
													'...'
												: event.Name
										}
										titleStyle={{
											fontSize: 16,
											textAlign: 'center',
											color: is_dark
												? colors.darkText
												: colors.lightText
										}}
										subtitle={subtitle}
										subtitleStyle={{
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
											marginTop: 5,
											alignItems: 'center',
											rowGap: 7,
											textAlign: 'center',
											fontSize: 10
										}}
										leftStyle={{
											marginLeft: 0,
											paddingLeft: 0,
											marginVertical: 0,
											width: '20%'
										}}
										left={leftComponent}
										right={rightComponent}
									/>
								</Card>
							);
						})}
					</View>
				) : timeoutDone ? (
					<View
						style={{
							alignItems: 'center',
							display: 'flex',
							flexDirection: 'column',
							rowGap: 10,
							justifyContent: 'center'
						}}
					>
						<Text
							style={{
								textAlign: 'center',
								color: is_dark
									? colors.darkText
									: colors.lightText
							}}
						>
							You do not have any upcoming events for this venue
						</Text>
					</View>
				) : (
					<ActivityIndicator size="large" color="purple" />
				)}
			</ScrollView>
		</View>
	);
}
