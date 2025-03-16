import { Venue } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useCallback, useState } from 'react';
import {
	Text,
	ScrollView,
	View,
	StatusBar,
	RefreshControl,
	ActivityIndicator,
	Image
} from 'react-native';
import { Card } from 'react-native-paper';
import { useDynamic } from '../hooks/DynamicSetup';

export default function Home() {
	const client = useDynamic();
	const navigation = useNavigation();

	const [refreshing, setRefreshing] = useState(false);
	const [shouldFetch, setShouldFetch] = useState<boolean>(false);
	const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
	const [cards, setCards] = useState<React.ReactNode>(null);
	const [page, setPage] = useState<number>(1);

	// handle scroll up page refresh
	const onRefresh = useCallback(() => {
		setRefreshing(true);
		setShouldFetch(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 1000);
	}, []);

	if (client.auth.token === null) client.ui.auth.show();

	client.auth.on('authFailed', () => {
		console.log('User failed to login');
	});
	client.auth.on('authSuccess', (user) => {
		console.log('User logged in', user);
		setShouldFetch(false);
		setIsLoggedIn(true);
	});
	client.ui.on('authFlowCancelled', () => {
		console.log('User cancelled the flow not cool');
		client.ui.auth.show();
	});

	const getFunc = useCallback(async () => {
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/vendor/venues?Page=${page}`,
			{
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);
		setShouldFetch(false);

		const data = await resp.json();
		if (!data || data.length === 0) setCards(null);

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
				{data.map((venue: Venue, idx: number) => {
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
							onPress={() =>
								navigation.navigate('Events', {
									Venue: venue.Pk,
									Name: venue.Name
								})
							}
						>
							{Object.keys(venue).map((key: string) => {
								if (
									key === 'Pk' ||
									key === 'ID' ||
									key === 'Venue' ||
									key === 'Vendor'
								) {
									return null;
								} else if (key === 'Photo') {
									return !venue['Photo'] ? null : (
										<Image
											source={{ uri: venue['Photo'] }}
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
										{venue[key as keyof typeof Venue]}
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
		if (isLoggedIn || shouldFetch) getFunc();
	}, [isLoggedIn, shouldFetch]);

	useEffect(() => {
		getFunc();
	}, [client.auth.token]);

	return (
		<>
			<View
				style={{
					backgroundColor: 'white',
					height: '100%',
					justifyContent: 'center'
				}}
			>
				{client.auth.token ? null : <client.reactNative.WebView />}
				<StatusBar
					backgroundColor={'white'}
					barStyle={'dark-content'}
					translucent={false}
					hidden={false}
				/>
				{client.auth.token != null ? (
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
				) : (
					<ActivityIndicator size="large" />
				)}
			</View>
		</>
	);
}
