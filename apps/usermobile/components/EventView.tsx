import { ContractAddress, ContractABI } from '@platform/blockchain';
import { UserEventResponse } from '@platform/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	Image,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	useColorScheme
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { polygonAmoy } from 'viem/chains';
import * as colors from '../constants/colors';
import { useDynamic } from './DynamicSetup';

type Params = {
	Event: {
		Event: string;
	};
};

export default function EventView({
	route
}: NativeStackScreenProps<Params, 'Event'>) {
	const is_dark = useColorScheme() === 'dark';
	const client = useDynamic();
	const { Event } = route.params; // this is the event id
	const [qrData, setqrData] = useState('test');
	const [displayData, setdisplayData] = useState(<Text>Loading...</Text>);

	const runner = async () => {
		console.log(`Event ${Event}`);
		const name = await getEventNameFromId(BigInt(Event));
		const split = name.split(' ');
		const uuid = split[split.length - 1];
		const data = await getEventByUUID(uuid);

		const keys = Object.keys(data as UserEventResponse);
		const values = Object.values(data as UserEventResponse);

		let photo_uri = '';
		console.log();

		setdisplayData(
			<>
				{values?.map((value: string | number, idx2: number) => {
					if (keys[idx2] === 'Eventphoto') {
						photo_uri = value as string;
						return null;
					} else if (keys[idx2] === 'ID') {
						return null;
					} else if (keys[idx2] === 'Venuephoto') {
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
				<Image
					key={100}
					style={{
						alignSelf: 'center',
						backgroundColor: 'white'
					}}
					source={{ uri: photo_uri }}
				/>
				<Text key={1000} style={{ textAlign: 'center' }}>
					Ticket id = {Event}
				</Text>
			</>
		);
	};

	useEffect(() => {
		runner();
	}, []);

	async function computeQRData(ticketid: string, ticketuuid: string) {
		if (client.wallets.primary == null) {
			console.warn('No primary wallet cannot compute qr code');
			return '';
		}

		const walletClient = await client.viem.createWalletClient({
			wallet: client.wallets.primary
		});

		const message = ticketuuid;
		const tmp = await walletClient.signMessage({ message });
		console.log(
			`${ticketid} ${tmp} ${client.auth.authenticatedUser?.verifiedCredentials[0].address}`
		);
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
			console.log(
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
		console.log(uuid);

		setqrData(await computeQRData(`${Event}`, `${uuid}`));

		console.log(qrData);
	}

	async function transfer() {
		console.log('transfer');
	}

	return (
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
			<View
				style={{
					flex: 1,
					rowGap: 10,
					alignItems: 'center',
					justifyContent: 'center'
				}}
			>
				<ScrollView>
					{displayData}
					<View
						style={{
							flex: 1,
							marginTop: 10,
							// rowGap: 10,
							alignItems: 'center',
							justifyContent: 'center'
						}}
					>
						{qrData == '' ? (
							<Text></Text>
						) : (
							<QRCode size={200} value={qrData} />
						)}
					</View>
				</ScrollView>
			</View>
			<View
				style={{
					marginBottom: 30,
					alignItems: 'center',
					flexDirection: 'row',
					justifyContent: 'center'
				}}
			>
				<TouchableOpacity
					onPress={transfer}
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
							color: is_dark ? colors.darkText : colors.lightText,
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
							color: is_dark ? colors.darkText : colors.lightText,
							textAlign: 'center'
						}}
					>
						Check in
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
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
	}
});
