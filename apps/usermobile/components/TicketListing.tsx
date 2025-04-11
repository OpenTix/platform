import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventDetailsResponse } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
import React from 'react';
import {
	View,
	Text,
	RefreshControl,
	ScrollView,
	Image,
	Pressable,
	StyleSheet
} from 'react-native';
import { Card } from 'react-native-paper';
import { polygonAmoy } from 'viem/chains';
import { useDynamic } from './DynamicSetup';

const queryClient = new QueryClient();

const HomeScreen = () => {
	const client = useDynamic();
	const [refreshing, setRefreshing] = React.useState(false);
	const navigation = useNavigation();

	// handle scroll up page refresh
	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 2000);
	}, []);

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

	// display events we own tickets to
	// will display multiple cards for the same event if you own multiple tickets to that event
	function Events() {
		// grab all our owned events
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['getAllOwnedEvents'],
			queryFn: getAllOwnedEvents
		});

		if (isPending) {
			return <Text> Loading ... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text>Error: {error.message}</Text>;
		}

		// grab our ticket ids and event data
		const ids = data['ids'];
		const event_data = data['event_data'];

		// this happens when the user owns no tickets
		if (event_data.length === 0) {
			return (
				<>
					<Image
						source={{
							uri: 'https://i.imgur.com/qoh1EKk.jpeg'
						}}
						style={{ width: 400, height: 600 }}
					/>
				</>
			);
		}

		return (
			<>
				{event_data?.map(
					(data: UserEventDetailsResponse, idx: number) => {
						// this should never happen but keeps the app from blowing up if it does
						if (data == undefined) {
							return null;
						}
						// these make the code read better
						const photo_uri = data['Eventphoto'];
						const ticketid = ids[idx].toString();
						const eventdate = new Date(data['EventDatetime']);

						return (
							<Pressable
								onPress={() => {
									// @ts-expect-error This is valid code, but typescript doesn't like it
									navigation.navigate('Event', {
										Event: ticketid
									});
								}}
								style={{ width: '100%' }}
							>
								<Card
									key={idx}
									style={{ display: 'flex', width: '100%' }}
								>
									<View style={styles.container}>
										<View style={styles.leftcolumn}>
											<Image
												source={{
													uri: photo_uri
												}}
												style={{
													aspectRatio: 1,
													maxHeight: 200,
													width: '80%',
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center'
												}}
											/>
										</View>
										<View style={styles.rightcolumn}>
											<Text style={{ fontSize: 20 }}>
												{data['Eventname']}
											</Text>
											<Text
												style={{ fontStyle: 'italic' }}
											>
												{data['Description']}
											</Text>
											<Text
												style={{ fontStyle: 'italic' }}
											>
												{'\n'}
												{eventdate.toLocaleTimeString()}{' '}
												{eventdate.toLocaleDateString()}
											</Text>
											<Text
												style={{
													flex: 1,
													textAlign: 'right'
												}}
											>
												#{ticketid}
											</Text>
										</View>
									</View>
								</Card>
							</Pressable>
						);
					}
				) ?? (
					<Card>
						<Text>You don't own any tickets :\</Text>
					</Card>
				)}
			</>
		);
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
				{client.auth.authenticatedUser != null ? (
					<QueryClientProvider client={queryClient}>
						<Events />
					</QueryClientProvider>
				) : (
					<></>
				)}
			</View>
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row', // This makes the container a row
		justifyContent: 'space-between', // Optional: Adds space between columns
		padding: 10
	},
	rightcolumn: {
		flex: 1
	},
	leftcolumn: {
		flex: 0.45,
		marginRight: 10 // Optional: Adds spacing between columns
	}
});

export default HomeScreen;
