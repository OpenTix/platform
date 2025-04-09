import AntDesign from '@expo/vector-icons/AntDesign';
import { Event } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useCallback, useState } from 'react';
import { ScrollView, Text, View, Image, RefreshControl } from 'react-native';
import { ActivityIndicator, Card } from 'react-native-paper';
import { useDynamic } from '../hooks/DynamicSetup';

type Params = {
	Events: {
		Venue: number;
		Name: string;
	};
};

export default function Events({
	route
}: NativeStackScreenProps<Params, 'Events'>) {
	const { Venue } = route.params;
	const VenueName = route.params.Name;
	const navigation = useNavigation();
	const client = useDynamic();

	const [cards, setCards] = useState<React.ReactNode>(null);
	const [timeoutDone, setTimeoutDone] = useState<boolean>(false);
	const [refreshing, setRefreshing] = useState<boolean>(false);
	const [shouldFetch, setShouldFetch] = useState<boolean>(true);

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
			`${process.env.EXPO_PUBLIC_API_BASEURL}/vendor/events?Venue=${Venue}`,
			{
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);
		const data = await resp.json();
		setShouldFetch(false);

		setCards(
			<View
				style={{
					alignItems: 'center',
					display: 'flex',
					flexDirection: 'column',
					rowGap: 10,
					justifyContent: 'center'
				}}
			>
				{data.map((event: Event, idx: number) => {
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

					const leftComponent = ({ size }: { size: number }) => (
						<Image
							source={{
								uri:
									event.Photo ??
									'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
							}}
							key={'Photo'}
							style={{
								width: 70,
								height: 70,
								borderRadius: 35
							}}
						/>
					);

					const rightComponent = ({ size }: { size: number }) => (
						<AntDesign name="right" size={size} />
					);

					const subtitle = (
						<View>
							<Text
								style={{
									color: 'black',
									textAlign: 'center',
									textAlignVertical: 'center'
								}}
							>
								{event.Type}
							</Text>
							<Text
								style={{
									color: 'black',
									textAlign: 'center',
									textAlignVertical: 'center'
								}}
							>
								{displayDate}
							</Text>
							<Text
								style={{
									color: 'black',
									textAlign: 'center',
									textAlignVertical: 'center'
								}}
							>
								${event.Basecost}
							</Text>
						</View>
					);

					return (
						<Card
							style={{
								minWidth: '90%',
								maxWidth: '90%',
								justifyContent: 'center',
								backgroundColor: 'white',
								marginHorizontal: 5,
								marginVertical: 5,
								padding: 10,
								paddingBottom: 12,
								elevation: 5,
								shadowColor: '#000', // Shadow for iOS
								shadowOffset: {
									width: 0,
									height: 2
								},
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
								title={
									event.Name.length > 25
										? event.Name.slice(0, 22) + '...'
										: event.Name
								}
								titleStyle={{
									fontSize: 16,
									textAlign: 'center'
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
									justifyContent: 'center',
									alignItems: 'center',
									width: '20%'
								}}
								left={leftComponent}
								right={rightComponent}
							/>
						</Card>
					);
				})}
			</View>
		);
	}, []);

	useEffect(() => {
		if (shouldFetch) getEvents();
		setTimeout(() => setTimeoutDone(true), 2000);
	}, [shouldFetch]);

	useEffect(() => {
		if (timeoutDone && !cards) {
			setCards(
				<View
					style={{
						alignItems: 'center',
						display: 'flex',
						flexDirection: 'column',
						rowGap: 10,
						justifyContent: 'center'
					}}
				>
					<Text style={{ textAlign: 'center' }}>
						You do not have any events for this venue
					</Text>
				</View>
			);
		}
	}, [timeoutDone]);

	return (
		<View
			style={{
				backgroundColor: 'white',
				height: '100%',
				justifyContent: 'center',
				alignContent: 'center'
			}}
		>
			{!cards ? (
				<ActivityIndicator size="large" color="purple" />
			) : (
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
					{cards}
				</ScrollView>
			)}
		</View>
	);
}
