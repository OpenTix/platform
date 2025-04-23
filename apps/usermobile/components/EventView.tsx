import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventDetailsResponse } from '@platform/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	Image,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	useColorScheme,
	Platform,
	Linking,
	Modal,
	TouchableWithoutFeedback,
	ActivityIndicator
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import QRCode from 'react-native-qrcode-svg';
import { polygonAmoy } from 'viem/chains';
import * as colors from '../constants/colors';
import { useDynamic } from './DynamicSetup';
import EventViewHeader from './EventViewHeader';

type Params = {
	Event: {
		Event: string;
	};
};

export default function EventView({
	route
}: NativeStackScreenProps<Params, 'Event'>) {
	const is_dark = useColorScheme() === 'dark';
	const fallbackURL =
		'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg';
	const client = useDynamic();
	const { Event } = route.params; // this is the event id
	const [qrData, setqrData] = useState('');
	const [displayData, setdisplayData] = useState(<Text>Loading...</Text>);
	const [eventData, setEventData] = useState<UserEventDetailsResponse>();
	const [modalVisible, setModalVisible] = useState(false);
	const [modalText, setModalText] = useState('');
	const [modalBlockInclusionVisible, setModalBlockInclusionVisible] =
		useState(false);
	const [modalTicketTransferableVisible, setModalTicketTransferableVisible] =
		useState(false);
	const [modalTransfersEnabledVisible, setModalTransfersEnabledVisible] =
		useState(false);
	const [ticketTransferable, setTicketTransferable] = useState(false);

	const runner = async () => {
		const name = await getEventNameFromId(BigInt(Event));
		const split = name.split(' ');
		const uuid = split[split.length - 1];
		const data = await getEventByUUID(uuid);
		setEventData(data as UserEventDetailsResponse);
		setTicketTransferable(await checkIfTicketIsTransferable());
	};

	useEffect(() => {
		setqrData('');
		runner();
	}, []);

	async function computeQRData(ticketid: string, ticketuuid: string) {
		if (client.wallets.primary == null) {
			console.error('No primary wallet cannot compute qr code');
			return '';
		}

		const walletClient = await client.viem.createWalletClient({
			wallet: client.wallets.primary
		});

		const message = ticketuuid;
		const tmp = await walletClient.signMessage({ message });
		return `${ticketid} ${tmp} ${client.auth.authenticatedUser?.verifiedCredentials[0].address}`;
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
			console.error(
				'Failed to create the public viem client when trying to get the event description.'
			);
			return '';
		}
	}

	// check the user in with the vendor
	async function checkin() {
		const name = await getEventNameFromId(BigInt(Event));
		const split = name.split(' ');
		const uuid = split[split.length - 1];

		setqrData(await computeQRData(`${Event}`, `${uuid}`));
		setModalText('Show the vendor this QR code');
		setModalVisible(true);
	}

	const checkIfTransfersEnabled = async () => {
		if (client.wallets.primary) {
			const publicViemClient = client.viem.createPublicClient({
				chain: polygonAmoy
			});
			const w = await client.viem.createWalletClient({
				wallet: client.wallets.primary
			});

			// get the events description from the id
			if (publicViemClient) {
				const data = (await publicViemClient.readContract({
					abi: ContractABI,
					address: ContractAddress,
					functionName: 'check_ticket_transfer_permission',
					account: w.account
				})) as boolean;

				return data;
			} else {
				console.error(
					'Failed to create the public viem client when trying to get the event description.'
				);
				return false;
			}
		}
		return false;
	};

	const checkIfTicketIsTransferable = async () => {
		if (client.wallets.primary) {
			const publicViemClient = client.viem.createPublicClient({
				chain: polygonAmoy
			});
			const w = await client.viem.createWalletClient({
				wallet: client.wallets.primary
			});

			// get the events description from the id
			if (publicViemClient) {
				const data = (await publicViemClient.readContract({
					abi: ContractABI,
					address: ContractAddress,
					functionName: 'check_ticket_transferable',
					args: [BigInt(Event)],
					account: w.account
				})) as boolean;

				return data;
			} else {
				console.error(
					'Failed to create the public viem client when trying to get the event description.'
				);
				return false;
			}
		}
		return false;
	};

	const enable_ticket_transfers = async () => {
		if (client.wallets.primary) {
			try {
				const p = await client.viem.createPublicClient({
					chain: polygonAmoy
				});
				const w = await client.viem.createWalletClient({
					wallet: client.wallets.primary
				});

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'allow_user_to_user_ticket_transfer',
						account: w.account,
						args: []
					});
					const hash = await w.writeContract(request);
					setModalBlockInclusionVisible(true);
					await p.waitForTransactionReceipt({
						hash: hash
					});

					setModalBlockInclusionVisible(false);
					return true;
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}

		setModalBlockInclusionVisible(false);
		return false;
	};

	const makeTicketTransferable = async () => {
		if (client.wallets.primary) {
			try {
				// setModalBlockInclusionVisible(true);
				const p = await client.viem.createPublicClient({
					chain: polygonAmoy
				});
				const w = await client.viem.createWalletClient({
					wallet: client.wallets.primary
				});

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: ContractABI,
						address: ContractAddress,
						functionName: 'allow_ticket_to_be_transfered',
						account: w.account,
						args: [BigInt(Event)]
					});
					const hash = await w.writeContract(request);
					setModalBlockInclusionVisible(true);
					await p.waitForTransactionReceipt({
						hash: hash
					});

					setModalBlockInclusionVisible(false);
					return true;
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
		setModalBlockInclusionVisible(false);
		return false;
	};

	async function transfer_step3() {
		setqrData(
			`${JSON.stringify({ address: client.auth.authenticatedUser?.verifiedCredentials[0].address, id: Event, basecost: eventData?.Basecost })}`
		);

		setModalText('Show the ticket buyer this QR code');
		setModalVisible(true);
	}

	async function transfer_step2() {
		const ticket_transferable = await checkIfTicketIsTransferable();

		if (!ticket_transferable) {
			// get user confirmation they want to make the ticket transferable
			setModalTicketTransferableVisible(true);
		}

		await transfer_step3();
	}

	async function transfer() {
		const transfers_enabled = await checkIfTransfersEnabled();

		if (!transfers_enabled) {
			// get user confirmation they want to enable ticket transfers
			setModalTransfersEnabledVisible(true);
		}

		await transfer_step2();
	}

	return (
		<>
			{/* Modal for enabling ticket transfers */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalTransfersEnabledVisible}
				onRequestClose={() => setModalTransfersEnabledVisible(false)} // For Android back button
			>
				<View style={styles.modalBackground}>
					<View style={styles.modalView}>
						<Text style={styles.modalText}>
							Would you like to enable ticket transfers for your
							account?
						</Text>
						<View
							style={{
								marginBottom: 10,
								marginTop: 10,
								alignItems: 'center',
								flexDirection: 'row',
								justifyContent: 'center',
								backgroundColor: 'transparent'
							}}
						>
							<TouchableOpacity
								onPress={() =>
									setModalTransfersEnabledVisible(false)
								}
								style={{
									backgroundColor: is_dark
										? colors.darkPrimary
										: colors.lightPrimary,
									borderRadius: 15,
									paddingTop: 5,
									paddingBottom: 5,
									width: '35%',
									elevation: 5,
									shadowColor: '#000', // Shadow for iOS
									shadowOffset: {
										width: 0,
										height: 2
									},
									shadowOpacity: 0.4,
									shadowRadius: 6,
									marginHorizontal: 10
								}}
							>
								<Text
									style={{
										color: is_dark
											? colors.darkText
											: colors.lightText,
										textAlign: 'center'
									}}
								>
									No
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									setModalTransfersEnabledVisible(false);
									if (!(await enable_ticket_transfers())) {
										console.error(
											'failed to enable ticket transfers for the user account'
										);
									}
									transfer_step2();
								}}
								style={{
									backgroundColor: is_dark
										? colors.darkPrimary
										: colors.lightPrimary,
									borderRadius: 15,
									paddingTop: 5,
									paddingBottom: 5,
									width: '35%',
									elevation: 5,
									shadowColor: '#000', // Shadow for iOS
									shadowOffset: {
										width: 0,
										height: 2
									},
									shadowOpacity: 0.4,
									shadowRadius: 6,
									marginHorizontal: 10
								}}
							>
								<Text
									style={{
										color: is_dark
											? colors.darkText
											: colors.lightText,
										textAlign: 'center'
									}}
								>
									Yes
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			{/* Modal for making ticket transferable */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalTicketTransferableVisible}
				onRequestClose={() => setModalTicketTransferableVisible(false)} // For Android back button
			>
				<View style={styles.modalBackground}>
					<View style={styles.modalView}>
						<Text style={styles.modalText}>
							Would you like to make this ticket transferable?
						</Text>
						<View
							style={{
								marginBottom: 10,
								marginTop: 10,
								alignItems: 'center',
								flexDirection: 'row',
								justifyContent: 'center',
								backgroundColor: 'transparent'
							}}
						>
							<TouchableOpacity
								onPress={() =>
									setModalTicketTransferableVisible(false)
								}
								style={{
									backgroundColor: is_dark
										? colors.darkPrimary
										: colors.lightPrimary,
									borderRadius: 15,
									paddingTop: 5,
									paddingBottom: 5,
									width: '35%',
									elevation: 5,
									shadowColor: '#000', // Shadow for iOS
									shadowOffset: {
										width: 0,
										height: 2
									},
									shadowOpacity: 0.4,
									shadowRadius: 6,
									marginHorizontal: 10
								}}
							>
								<Text
									style={{
										color: is_dark
											? colors.darkText
											: colors.lightText,
										textAlign: 'center'
									}}
								>
									No
								</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={async () => {
									setModalTicketTransferableVisible(false);
									if (!(await makeTicketTransferable())) {
										console.error(
											'failed to enable transfer for the ticket'
										);
									}
									transfer_step3();
								}}
								style={{
									backgroundColor: is_dark
										? colors.darkPrimary
										: colors.lightPrimary,
									borderRadius: 15,
									paddingTop: 5,
									paddingBottom: 5,
									width: '35%',
									elevation: 5,
									shadowColor: '#000', // Shadow for iOS
									shadowOffset: {
										width: 0,
										height: 2
									},
									shadowOpacity: 0.4,
									shadowRadius: 6,
									marginHorizontal: 10
								}}
							>
								<Text
									style={{
										color: is_dark
											? colors.darkText
											: colors.lightText,
										textAlign: 'center'
									}}
								>
									Yes
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
			{/* Modal for block inclusion */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalBlockInclusionVisible}
				onRequestClose={() => setModalBlockInclusionVisible(false)} // For Android back button
			>
				<View style={styles.modalBackground}>
					<View style={styles.modalView}>
						<Text style={styles.modalText}>
							Waiting for block inclusion...
						</Text>
						<ActivityIndicator size={'large'} />
					</View>
				</View>
			</Modal>
			{/* Modal for QRCode */}
			<Modal
				animationType="fade"
				transparent={true}
				visible={modalVisible}
				onRequestClose={() => setModalVisible(false)} // For Android back button
			>
				<TouchableWithoutFeedback
					onPress={() => setModalVisible(false)}
				>
					<View style={styles.modalBackground}>
						<View style={styles.modalView}>
							<Text style={styles.modalText}>{modalText}</Text>
							{
								// this is written this way because QRCode will crash the app if qrData is weird (should never happen as is mitigated elsewhere, but going to leave it just in case)
								qrData == '' ? (
									<Text></Text>
								) : (
									<QRCode size={200} value={qrData} />
								)
							}
						</View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>
			{eventData && <EventViewHeader data={eventData} ticketid={Event} />}
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					backgroundColor: is_dark
						? colors.darkBackground
						: colors.lightBackground,
					height: '100%'
				}}
			>
				<ScrollView contentContainerStyle={{ flexGrow: 1 }}>
					<Card
						style={{
							minWidth: '98%',
							maxWidth: '98%',
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
							shadowRadius: 6,
							alignSelf: 'center'
						}}
					>
						<Card.Title title={'Description'} />
						<Text
							style={{
								textAlign: 'left',
								marginLeft: 20,
								marginRight: 20
							}}
						>
							{'          '}
							{eventData?.Description}
						</Text>
					</Card>
					<Card
						style={{
							minWidth: '98%',
							maxWidth: '98%',
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
							shadowRadius: 6,
							alignSelf: 'center'
						}}
					>
						<Card.Title title={'Disclaimer'} />
						<Text
							style={{
								textAlign: 'left',
								marginLeft: 20,
								marginRight: 20
							}}
						>
							{'          '}
							{eventData?.Disclaimer}
						</Text>
					</Card>

					<Card
						style={{
							minWidth: '98%',
							maxWidth: '98%',
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
							shadowRadius: 6,
							alignSelf: 'center'
						}}
					>
						<Card.Title title={'Address'} />
						<Button
							onPress={() => {
								if (!eventData) return;

								const scheme = Platform.select({
									ios: 'maps:0,0?q=',
									android: 'geo:0,0?q='
								});
								const url2 = `${scheme}${eventData.StreetAddress}, ${eventData.City}, ${eventData.StateCode}`;

								Linking.openURL(url2).catch((err) =>
									console.error('An error occurred', err)
								);
							}}
						>{`${eventData?.StreetAddress} ${eventData?.City} ${eventData?.StateCode} ${eventData?.Zip}`}</Button>
					</Card>
				</ScrollView>
				<View
					style={{
						marginBottom: 10,
						marginTop: 10,
						alignItems: 'center',
						flexDirection: 'row',
						justifyContent: 'center',
						backgroundColor: 'transparent'
					}}
				>
					<TouchableOpacity
						onPress={transfer}
						style={{
							borderRadius: 15,
							paddingTop: 5,
							paddingBottom: 5,
							width: '35%',
							elevation: 5,
							shadowColor: '#000', // Shadow for iOS
							shadowOffset: {
								width: 0,
								height: 2
							},
							shadowOpacity: 0.4,
							shadowRadius: 6,
							marginHorizontal: 10,
							backgroundColor: ticketTransferable
								? colors.green
								: is_dark
									? colors.darkPrimary
									: colors.lightPrimary
						}}
					>
						<Text
							style={{
								color: is_dark
									? colors.darkText
									: colors.lightText,
								textAlign: 'center'
							}}
						>
							Transfer
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={checkin}
						style={{
							backgroundColor: is_dark
								? colors.darkPrimary
								: colors.lightPrimary,
							borderRadius: 15,
							paddingTop: 5,
							paddingBottom: 5,
							width: '35%',
							elevation: 5,
							shadowColor: '#000', // Shadow for iOS
							shadowOffset: {
								width: 0,
								height: 2
							},
							shadowOpacity: 0.4,
							shadowRadius: 6,
							marginHorizontal: 10
						}}
					>
						<Text
							style={{
								color: is_dark
									? colors.darkText
									: colors.lightText,
								textAlign: 'center'
							}}
						>
							Check in
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center'
	},
	modalBackground: {
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'rgba(0,0,0,0.5)'
	},
	modalView: {
		margin: 20,
		padding: 35,
		backgroundColor: 'white',
		borderRadius: 10,
		alignItems: 'center'
	},
	modalText: {
		marginBottom: 15,
		fontSize: 18
	}
});
