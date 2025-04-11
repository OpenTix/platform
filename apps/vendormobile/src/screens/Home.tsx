import AntDesign from '@expo/vector-icons/AntDesign';
import { Venue } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useCallback, useState } from 'react';
import {
	Text,
	ScrollView,
	View,
	StatusBar,
	RefreshControl,
	Image,
	useColorScheme
} from 'react-native';
import { Card, ActivityIndicator } from 'react-native-paper';
import * as colors from '../constants/colors';
import { useDynamic } from '../hooks/DynamicSetup';

export default function Home() {
	const is_dark = useColorScheme() === 'dark';
	const client = useDynamic();
	const navigation = useNavigation();

	const [refreshing, setRefreshing] = useState(false);
	const [shouldFetch, setShouldFetch] = useState<boolean>(false);
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
					const leftComponent = ({ size }: { size: number }) => (
						<View>
							<Image
								source={{
									uri:
										venue.Photo ??
										'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
								}}
								key={'Photo'}
								style={{
									width: 70,
									height: 70,
									borderRadius: 35
								}}
							/>
						</View>
					);

					const rightComponent = ({ size }: { size: number }) => (
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
								{venue.StreetAddress}
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
								{venue.City}, {venue.StateName} {venue.Zip}
							</Text>
						</View>
					);

					return (
						<Card
							style={{
								minWidth: '90%',
								maxWidth: '90%',
								justifyContent: 'center',
								backgroundColor: is_dark
									? colors.darkPrimary
									: colors.lightPrimary,
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
							onPress={() =>
								navigation.navigate('Events', {
									Venue: venue.Pk,
									Name: venue.Name
								})
							}
						>
							<Card.Title
								title={
									venue.Name.length > 25
										? venue.Name.slice(0, 22) + '...'
										: venue.Name
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
		if (shouldFetch) getFunc();
	}, [shouldFetch]);

	useEffect(() => {
		getFunc();
	}, [client.auth.token]);

	return (
		<>
			<View
				style={{
					backgroundColor: is_dark
						? colors.darkBackground
						: colors.lightBackground,
					height: '100%',
					justifyContent: 'center'
				}}
			>
				<StatusBar
					backgroundColor={
						is_dark ? colors.darkBackground : colors.lightBackground
					}
					barStyle={is_dark ? 'light-content' : 'dark-content'}
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
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: 'center',
							paddingBottom: 10,
							paddingTop: 10
						}}
					>
						{cards}
					</ScrollView>
				) : (
					<ActivityIndicator size="large" color="purple" />
				)}
			</View>
		</>
	);
}
