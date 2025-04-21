import AntDesign from '@expo/vector-icons/AntDesign';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventDetailsResponse } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	RefreshControl,
	ScrollView,
	Image,
	Pressable,
	StyleSheet,
	useColorScheme,
	LayoutChangeEvent
} from 'react-native';
import { Card } from 'react-native-paper';
import { polygonAmoy } from 'viem/chains';
import * as colors from '../constants/colors';
import { useDynamic } from './DynamicSetup';

type dataType = {
	ids: bigint[];
	event_data: UserEventDetailsResponse[];
};

const HomeScreen = () => {
	const is_dark = useColorScheme() === 'dark';
	const client = useDynamic();
	const [refreshing, setRefreshing] = useState(false);
	const navigation = useNavigation();
	const [cardHeights, setCardHeights] = useState<Record<string, number>>({});
	const [isPending, setIsPending] = useState<boolean>(true);
	const [gdata, setGData] = useState<dataType>();
	const [running, setRunning] = useState<boolean>(false);

	const handleLayout = (index: number, layoutEvent: LayoutChangeEvent) => {
		const { height } = layoutEvent.nativeEvent.layout;
		console.log(`height=${height}`);
		setCardHeights((prev) => ({ ...prev, [index]: height + 1 }));
	};

	// handle scroll up page refresh
	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		setIsPending(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 2000);
	}, []);

	const updateData = async () => {
		setGData(await getAllOwnedEvents());
		setRunning(false);
		setIsPending(false);
	};

	useEffect(() => {
		if (isPending) {
			if (!running) {
				console.log('running!');
				setRunning(true);
				updateData();
			}
		}
	}, [isPending]);

	async function getNFTsInWallet() {
		const url = `${process.env.EXPO_PUBLIC_API_BASEURL}/oklink?wallet=${client.auth.authenticatedUser?.verifiedCredentials[0].address}&tokenContractAddress=${ContractAddress}&chainShortName=amoy_testnet`;
		const resp = await fetch(url, {
			method: 'GET',
			headers: { Authorization: `Bearer ${client.auth.token}` }
		});

		if (!resp.ok)
			return Error('There was an error fetching data from oklink');

		// this is nasty but it gives us what we want
		return (await resp.json())['data'][0]['tokenList'];
	}

	// Return an array of owned ticket ids
	async function getOwnedTicketIds() {
		const tmp = await getNFTsInWallet();

		try {
			// parse into an array
			const data = JSON.parse(JSON.stringify(tmp));

			// make temp array
			let owned_ids = Array(0);

			// fill it with the tokenIds
			for (let i = 0; i < data.length; i++) {
				owned_ids.push(data[i]['tokenId']);
			}

			// sort for easy reading
			owned_ids = owned_ids.sort();

			return owned_ids;
		} catch (error) {
			// pls never go here
			console.error(
				'Failed to parse the JSON response from the oklink api: ',
				error
			);
			return null;
		}
	}

	// query the contract (not on network) for the event name for an id
	async function getEventNameFromId(id: bigint) {
		const publicViemClient = client.viem.createPublicClient({
			chain: polygonAmoy
		});

		// get the events description from the id
		if (publicViemClient) {
			const data = (await publicViemClient.readContract({
				abi: ContractABI,
				address: ContractAddress,
				functionName: 'get_event_description',
				args: [id]
			})) as string;

			return data;
		} else {
			console.log(
				'Failed to create the public viem client when trying to get the event description.'
			);
			return '';
		}
	}

	// query our backend for the event data using the uuid
	async function getEventByUUID(UUID: string) {
		const resp = await fetch(
			`https://api.dev.opentix.co/user/events?ID=${UUID}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);

		if (!resp.ok) {
			return Error('There was an error fetching event data by UUID');
		}
		return await resp.json();
	}

	// return a dict of our owned ticket ids and event data for each
	async function getAllOwnedEvents() {
		const ids = (await getOwnedTicketIds()) as bigint[];

		// get all the event names from the ids (calls contract)
		const event_names = Array(ids.length).fill('') as string[];
		let iterator = 0;
		for (let i = 0; i < event_names.length; i++) {
			const id = ids[i];
			event_names[iterator] = await getEventNameFromId(BigInt(id));
			iterator += 1;
		}

		// get the event data for all the events we have
		const event_data = Array(ids.length) as UserEventDetailsResponse[];
		for (let i = 0; i < event_names.length; i++) {
			// minimize the number of calls to the backend api
			if (i != 0 && event_names[i] === event_names[i - 1]) {
				event_data[i] = event_data[i - 1];
				continue;
			}

			// grab the event data
			const split = event_names[i].split(' ');
			const uuid = split[split.length - 1];
			event_data[i] = await getEventByUUID(uuid);
		}

		return { ids, event_data };
	}

	return (
		<ScrollView
			refreshControl={
				<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
			}
		>
			<View
				style={{
					// flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					display: 'flex',
					flexDirection: 'column',
					rowGap: 10
				}}
			>
				{client.auth.authenticatedUser != null &&
					gdata &&
					(gdata['event_data']?.map(
						(data: UserEventDetailsResponse, idx: number) => {
							// this should never happen but keeps the app from blowing up if it does
							if (data == undefined) {
								return null;
							}

							const ids = gdata['ids'];
							// these make the code read better
							const photo_uri = data['Eventphoto'];
							const ticketid = ids[idx];
							const date = new Date(data['EventDatetime']);
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
											photo_uri ??
											'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
									}}
									key={'Photo'}
									style={{
										height: cardHeights[idx] || 115,
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
								<Text
									style={{
										color: is_dark
											? colors.darkSecondary
											: colors.lightSecondary,
										textAlign: 'center',
										textAlignVertical: 'center'
									}}
								>
									{data['Type']}
									{'\n'}
									{displayDate}
									{'\n'}#{ticketid}
								</Text>
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
										console.log('hi');
										// @ts-expect-error This is valid code, but typescript doesn't like it
										navigation.navigate('Event', {
											Event: ticketid
										});
									}}
								>
									<Card.Title
										style={{
											paddingLeft: 0, // This removes internal padding in the Card.Title
											marginLeft: 0 // This ensures the component aligns with the edge
										}}
										title={
											data['Eventname'].length > 25
												? data['Eventname'].slice(
														0,
														22
													) + '...'
												: data['Eventname']
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
											fontSize: 12
										}}
										subtitleNumberOfLines={3}
										leftStyle={{
											marginLeft: 0,
											paddingLeft: 0,
											marginVertical: 0,
											width: '20%'
										}}
										left={leftComponent}
										rightStyle={{ marginRight: 10 }}
										right={rightComponent}
									/>
								</Card>
							);
						}
					) ?? (
						<Card>
							<Text>You don't own any tickets :\</Text>
						</Card>
					))}
			</View>
		</ScrollView>
	);
};

export default HomeScreen;
