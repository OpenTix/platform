import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventResponse } from '@platform/types';
import { ScrollArea } from '@radix-ui/themes';
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
	Modal,
	Alert,
	Pressable,
	StyleSheet,
	TouchableOpacity
} from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import { polygonAmoy } from 'viem/chains';
import { useDynamic } from './DynamicSetup';

const queryClient = new QueryClient();

const HomeScreen = () => {
	const client = useDynamic();
	const [refreshing, setRefreshing] = React.useState(false);
	const [modalVisible, setModalVisible] = React.useState(false);
	const [gData, setgData] = React.useState({
		ids: Array(0) as bigint[],
		event_data: Array(0) as UserEventResponse[]
	});
	const [modalData, setmodalData] = React.useState(<></>);

	function checkin() {
		console.log('The checkin code should go here :)');
	}

	function setupModal(index: number) {
		const ids = gData['ids'];
		const events_data = gData['event_data'];

		const id = ids[index];
		const event_data = events_data[index];

		const keys = Object.keys(event_data);
		const values = Object.values(event_data);

		let photo_uri = '';

		setmodalData(
			<>
				{values?.map((value: string | number, idx2: number) => {
					if (keys[idx2] === 'Eventphoto') {
						photo_uri = value as string;
						return null;
					} else if (keys[idx2] === 'ID') {
						return null;
					}
					return (
						<Text key={idx2} style={{ textAlign: 'center' }}>
							{keys[idx2]}:{' '}
							{keys[idx2] === 'EventDatetime'
								? new Date(value).toLocaleString()
								: keys[idx2] === 'Basecost'
									? `$${value}`
									: value}
						</Text>
					);
				})}
				<Avatar.Image
					style={{ alignSelf: 'center' }}
					source={{ uri: photo_uri }}
				/>
				<Text style={{ textAlign: 'center' }}>
					Ticket id = {id.toString()}
				</Text>
			</>
		);

		// console.log(modalData);
	}

	// handle scroll up page refresh
	const onRefresh = React.useCallback(() => {
		setRefreshing(true);
		setTimeout(() => {
			setRefreshing(false);
		}, 2000);
	}, []);

	// fetchs from oklinks api to see what tickets an account owns
	// this is set to amoy_testnet and is not an environment variable because I am lazy
	// also yes that is my api key I do not care I get 1 mil requests per year and they don't have my payment info 😁
	// this only handles up to 100 tickets so thats an issue for full deployment but not a real issue for our project
	// api doc here: https://www.oklink.com/docs/en/#fundamental-blockchain-data-address-data-get-token-balance-details-by-address
	async function getNFTsInWallet() {
		const url = `https://www.oklink.com/api/v5/explorer/nft/address-balance-fills?chainShortName=amoy_testnet&address=${client.auth.authenticatedUser?.verifiedCredentials[0].address}&tokenContractAddress=${ContractAddress}&limit=100&protocolType=token_1155`;
		const resp = await fetch(url, {
			method: 'GET',
			headers: { 'Ok-Access-Key': '4dc070a9-44a6-474c-afc2-e8976eae75b7' }
		});

		if (!resp.ok) return Error('There was an error fetching data');

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
			console.error('oh no...', error);
			return null;
		}
	}

	// query the contract (not on network) for the event name for an id
	async function getEventNameFromId(id: bigint) {
		const publicViemClient = client.viem.createPublicClient({
			chain: polygonAmoy
		});

		if (publicViemClient) {
			const data = (await publicViemClient.readContract({
				abi: ContractABI,
				address: ContractAddress,
				functionName: 'get_event_description',
				args: [id]
			})) as string;

			return data;
		} else {
			console.log('if you see this something bad happened');
			return '';
		}
	}

	// query our backend for the event data using the uuid
	async function getEventByUUID(UUID: string) {
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/user/events?ID=${UUID}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);

		if (!resp.ok) {
			return Error('There was an error fetching data');
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
		const event_data = Array(ids.length) as UserEventResponse[];
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

		// set the data globally so the modal can access it
		setgData(data);

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
				<Modal
					animationType="slide"
					transparent={true}
					visible={modalVisible}
					onRequestClose={() => {
						Alert.alert('Modal has been closed.');
						setModalVisible(!modalVisible);
					}}
				>
					<TouchableOpacity
						activeOpacity={1}
						style={styles.centeredView}
						onPress={() => setModalVisible(!modalVisible)}
					>
						<View style={styles.centeredView}>
							<View style={styles.modalView}>
								<ScrollView>
									<TouchableOpacity activeOpacity={1}>
										{modalData}
									</TouchableOpacity>
								</ScrollView>
								<TouchableOpacity activeOpacity={1}>
									<Pressable
										style={[
											styles.button,
											styles.buttonClose
										]}
										onPress={() => {
											checkin();
										}}
									>
										<Text style={styles.textStyle}>
											Check In
										</Text>
									</Pressable>
								</TouchableOpacity>
							</View>
						</View>
					</TouchableOpacity>
				</Modal>
				{event_data?.map((data: UserEventResponse, idx: number) => {
					// this should never happen but keeps the app from blowing up if it does
					if (data == undefined) {
						return null;
					}

					// these make the code read better
					const keys = Object.keys(data);
					const values = Object.values(data);
					let photo_uri = '';
					const ticketid = ids[idx].toString();

					return (
						<Pressable
							// style={[
							// 	styles.button,
							// 	styles.buttonClose
							// ]}
							onPress={() => {
								setupModal(idx);
								setModalVisible(!modalVisible);
							}}
						>
							<Card key={idx} style={{ display: 'flex' }}>
								{values?.map(
									(value: string | number, idx2: number) => {
										if (keys[idx2] === 'Eventphoto') {
											photo_uri = value as string;
											return null;
										} else if (keys[idx2] === 'ID') {
											return null;
										}
										return (
											<Text key={idx2}>
												{keys[idx2]}:{' '}
												{keys[idx2] === 'EventDatetime'
													? new Date(
															value
														).toLocaleString()
													: keys[idx2] === 'Basecost'
														? `$${value}`
														: value}
											</Text>
										);
									}
								)}
								<Image
									source={{
										uri: photo_uri
									}}
									style={{
										height: undefined,
										width: '100%',
										aspectRatio: 1,
										maxHeight: 200,
										alignSelf: 'center'
									}}
								/>
								{/* <Avatar.Image source={{ uri: photo_uri }} /> */}
								<Text>Ticket id = {ticketid}</Text>
							</Card>
						</Pressable>
					);
				}) ?? (
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
	centeredView: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalView: {
		margin: 20,
		backgroundColor: 'white',
		borderRadius: 20,
		padding: 35,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2
		},
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
		width: '80%',
		maxHeight: '75%'
	},
	button: {
		borderRadius: 20,
		padding: 10,
		elevation: 2
	},
	buttonOpen: {
		backgroundColor: '#F194FF'
	},
	buttonClose: {
		backgroundColor: '#2196F3'
	},
	textStyle: {
		color: 'white',
		fontWeight: 'bold',
		textAlign: 'center'
	},
	modalText: {
		marginBottom: 15,
		textAlign: 'center'
	}
});

export default HomeScreen;
