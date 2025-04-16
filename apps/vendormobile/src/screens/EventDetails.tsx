import { ContractAddress, ContractABI } from '@platform/blockchain';
import { Event } from '@platform/types';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import {
	Text,
	View,
	Image,
	TouchableOpacity,
	useColorScheme
} from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { Address } from 'viem';
import { polygonAmoy } from 'viem/chains';
import * as colors from '../constants/colors';
import { useDynamic } from '../hooks/DynamicSetup';

type Params = {
	EventDetails: {
		Event: string;
	};
};

export default function EventDetails({
	route
}: NativeStackScreenProps<Params, 'EventDetails'>) {
	const is_dark = useColorScheme() === 'dark';
	const client = useDynamic();
	const { Event } = route.params;
	const [view, setView] = useState<React.ReactNode>(null);
	const [intermediate, setIntermediate] = useState('');
	let qrData2 = '';
	const navigation = useNavigation();

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

	// fetchs from oklinks api to see what tickets an account owns
	// this is set to amoy_testnet and is not an environment variable because I am lazy
	// also yes that is my api key I do not care I get 1 mil requests per year and they don't have my payment info 😁
	// this only handles up to 100 tickets so thats an issue for full deployment but not a real issue for our project
	// api doc here: https://www.oklink.com/docs/en/#fundamental-blockchain-data-address-data-get-token-balance-details-by-address
	async function getNFTsInWallet(address: string) {
		const url = `https://www.oklink.com/api/v5/explorer/nft/address-balance-fills?chainShortName=amoy_testnet&address=${address}&tokenContractAddress=${ContractAddress}&limit=100&protocolType=token_1155`;
		const resp = await fetch(url, {
			method: 'GET',
			headers: { 'Ok-Access-Key': '4dc070a9-44a6-474c-afc2-e8976eae75b7' }
		});

		if (!resp.ok)
			return Error('There was an error fetching data from oklink');

		// this is nasty but it gives us what we want
		return (await resp.json())['data'][0]['tokenList'];
	}

	// try to checkin the ticket id for the event uuid
	async function checkin(UUID: string, ticket_id: number) {
		const tosubmit = { Event: UUID, TicketID: ticket_id };

		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/vendor/events/tickets`,
			{
				method: 'PATCH',
				headers: { Authorization: `Bearer ${client.auth.token}` },
				body: JSON.stringify(tosubmit)
			}
		);

		// this should be updated to add more info
		if (!resp.ok) {
			return false;
		} else {
			return true;
		}
	}

	async function verifyScanIn(data: string) {
		const fields = data.split(' ');
		if (fields.length < 3) return 'invalid scan in data';
		const id = fields[0];
		const signedmessage = fields[1];
		const senderaddress = fields[2];

		const event_name = await getEventNameFromId(BigInt(id));
		const split = event_name.split(' ');
		const uuid = split[split.length - 1];

		const tmp = await getNFTsInWallet(senderaddress);
		// parse into an array
		const jsondata = JSON.parse(JSON.stringify(tmp));

		// make temp array
		let owned_ids = Array(0) as bigint[];

		// fill it with the tokenIds
		for (let i = 0; i < jsondata.length; i++) {
			owned_ids.push(jsondata[i]['tokenId'] as bigint);
		}

		owned_ids = owned_ids.sort();

		let hasID = false;
		for (const owned_id in owned_ids) {
			if (owned_ids[owned_id] == BigInt(id)) {
				hasID = true;
				break;
			}
		}

		if (hasID === false) {
			return 'Sender does not own the ticket.';
		}

		const publicViemClient = client.viem.createPublicClient({
			chain: polygonAmoy
		});

		const valid = await publicViemClient.verifyMessage({
			address: senderaddress as Address,
			message: uuid,
			signature: signedmessage as Address
		});

		if (!valid) {
			return 'Sender did not sign the message properly.';
		}

		// do the api call
		const resp = await checkin(uuid, parseInt(id));

		if (!resp) {
			return 'Ticket already checked in';
		}

		return 'success';
	}

	const navigateToQRCamera = () => {
		navigation.navigate('QRCamera', {
			onGoBack: (data: string) => {
				setIntermediate(data);
			}
		});
	};

	const getFunc = useCallback(async () => {
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/vendor/events?ID=${Event}`,
			{
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);
		const data: Event = await resp.json();
		const date = new Date(data.EventDatetime);
		const month = date.toLocaleString('default', { month: 'short' });
		const day = date.getDate();
		const dayOfWeek = date.toLocaleString('default', { weekday: 'short' });
		const time = date.toLocaleString('default', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});

		if (intermediate !== '') {
			const ret = await verifyScanIn(intermediate);
			qrData2 = ret;
		}

		const displayDate = `${dayOfWeek} ${month} ${day}, ${date.getFullYear()} ${time}`;
		setView(
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
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Name: {data.Name}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Cost: ${data.Basecost}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Unique Seats: {data.NumUnique}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						General Admission: {data.NumGa}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Event Type: {data.Type}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Description: {data.Description}
					</Text>
					<Text
						style={{
							color: is_dark ? colors.darkText : colors.lightText
						}}
					>
						Disclaimer: {data.Disclaimer}
					</Text>
					<View
						style={{
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'center',
							columnGap: 10
						}}
					>
						<Text
							style={{
								color: is_dark
									? colors.darkText
									: colors.lightText
							}}
						>
							{displayDate}
						</Text>
					</View>
					<Image
						source={{
							uri:
								data.Photo ??
								'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
						}}
						style={{
							width: '100%',
							height: undefined,
							aspectRatio: 1,
							maxHeight: 200,
							borderRadius: 10
						}}
					/>
					{qrData2 === '' && intermediate !== '' ? (
						<>
							<Text
								style={{
									color: is_dark
										? colors.darkText
										: colors.lightText,
									textAlign: 'center'
								}}
							>
								Checking in...
							</Text>
							<ActivityIndicator size="small" color="purple" />
						</>
					) : qrData2 !== 'success' ? (
						<Text
							style={{
								color: is_dark
									? colors.darkText
									: colors.lightText,
								textAlign: 'center'
							}}
						>
							{qrData2}
						</Text>
					) : (
						qrData2 === 'success' && (
							<Text
								style={{
									color: is_dark
										? colors.darkText
										: colors.lightText,
									textAlign: 'center'
								}}
							>
								You have been checked in
							</Text>
						)
					)}
				</View>
				<View style={{ marginBottom: 30, alignItems: 'center' }}>
					{data.TransactionHash === null ? (
						<Text
							style={{
								color: is_dark
									? colors.darkText
									: colors.lightText,
								textAlign: 'center'
							}}
						>
							You do not have any tickets for this event yet.{' '}
							{'\n'} Please visit{' '}
							{process.env.EXPO_PUBLIC_API_BASEURL?.replace(
								'api',
								'vendor'
							)}{' '}
							to create some.
						</Text>
					) : (
						<TouchableOpacity
							onPress={navigateToQRCamera}
							style={{
								backgroundColor: is_dark
									? colors.darkPrimary
									: colors.lightPrimary,
								borderRadius: 15,
								paddingTop: 5,
								paddingBottom: 5,
								width: '50%',
								elevation: 5,
								shadowColor: '#000', // Shadow for iOS
								shadowOffset: {
									width: 0,
									height: 2
								},
								shadowOpacity: 0.4,
								shadowRadius: 6
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
					)}
				</View>
			</View>
		);
	}, [intermediate]);

	useEffect(() => {
		getFunc();
	}, [intermediate]);

	return view;
}
