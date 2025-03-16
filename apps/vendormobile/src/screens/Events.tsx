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
					return (
						<Card
							key={idx}
							style={{
								minWidth: '80%',
								maxWidth: '80%',
								borderRadius: 15,
								borderColor: 'black',
								paddingTop: 10,
								paddingBottom: 10,
								paddingLeft: 10,
								paddingRight: 10,
								display: 'flex',
								flexDirection: 'column',
								rowGap: 5,
								justifyContent: 'center',
								backgroundColor: '#8030F0',
								shadowColor: 'white'
							}}
							onPress={() => {
								navigation.navigate('EventDetails', {
									Event: event.ID
								});
							}}
						>
							{Object.keys(event).map((key: string) => {
								if (
									key === 'Pk' ||
									key === 'ID' ||
									key === 'Venue' ||
									key === 'Vendor'
								) {
									return null;
								} else if (key === 'Photo') {
									return !event['Photo'] ? null : (
										<Image
											source={{ uri: event['Photo'] }}
											key={key}
											style={{
												marginTop: 5,
												width: '100%',
												height: undefined,
												aspectRatio: 1,
												maxHeight: 200,
												alignSelf: 'center'
											}}
										/>
									);
								} else if (key === 'EventDatetime') {
									const date = new Date(event.EventDatetime);
									const month = date.toLocaleString(
										'default',
										{ month: 'short' }
									);
									const day = date.getDate();
									const dayOfWeek = date.toLocaleString(
										'default',
										{ weekday: 'short' }
									);
									const time = date.toLocaleString(
										'default',
										{
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										}
									);

									const dateUpper =
										new Date().getFullYear() ===
										date.getFullYear()
											? `${dayOfWeek}, ${month} ${day}`
											: `${dayOfWeek}, ${month} ${day}, ${date.getFullYear()}`;
									const dateLower = `${time}`;
									return (
										<View
											key={key}
											style={{
												display: 'flex',
												flexDirection: 'row',
												justifyContent: 'center',
												columnGap: 10
											}}
										>
											<Text style={{ color: 'white' }}>
												{dateUpper}
											</Text>
											<Text style={{ color: 'white' }}>
												{dateLower}
											</Text>
										</View>
									);
								}
								return (
									<Text
										key={key}
										style={{
											color: 'white',
											textAlign: 'center',
											textAlignVertical: 'center'
										}}
									>
										{key}:{' '}
										{event[key as keyof typeof Event]}
									</Text>
								);
							})}
						</Card>
					);
				})}
			</View>
		);
	}, []);

	useEffect(() => {
		if (shouldFetch) getEvents();
		setTimeout(() => setTimeoutDone(true), 3000);
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
				<ActivityIndicator size="large" />
			) : (
				<ScrollView
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
						/>
					}
					style={{ marginTop: 10, marginBottom: 10 }}
					contentContainerStyle={{
						flexGrow: 1,
						justifyContent: 'center'
					}}
				>
					{cards}
				</ScrollView>
			)}
		</View>
	);
}
