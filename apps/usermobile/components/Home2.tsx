import { createAccountAbstractionModule } from '@dynamic-labs/client/src/modules/walletsModule/accountAbstractionModule';
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { ContractAddress, ContractABI } from '@platform/blockchain';
import { useNavigation } from '@react-navigation/native';
import { lookup } from 'dns';
import { tmpdir } from 'os';
import { View, Button, Text } from 'react-native';
import { polygonAmoy } from 'viem/chains';
import { useDynamic } from './DynamicSetup';

// import EventHandler from './EventHandler';

const HomeScreen = () => {
	// const navigation = useNavigation();
	const client = useDynamic();

	async function getNFTsInWallet() {
		const url = `https://www.oklink.com/api/v5/explorer/nft/address-balance-fills?chainShortName=amoy_testnet&address=${client.auth.authenticatedUser?.verifiedCredentials[0].address}&tokenContractAddress=${ContractAddress}&limit=100&protocolType=token_1155`;
		const resp = await fetch(url, {
			method: 'GET',
			headers: { 'Ok-Access-Key': '4dc070a9-44a6-474c-afc2-e8976eae75b7' }
		});

		if (!resp.ok) return Error('There was an error fetching data');

		return (await resp.json())['data'][0]['tokenList'];
	}

	const getOwnedTicketIds = async () => {
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

			// remove later
			console.log(owned_ids);

			return owned_ids;
		} catch (error) {
			// pls never go here
			console.log('oh no...', error);
			return null;
		}
	};

	// TODO:
	// We need to show what tickets someone has. Currently there is no nice ticketid to event function in the smart contract.
	// Although one may be added in the future we have to make a work around for now.
	// So, the plan is to first query our server for events.
	// Then, filter to only events with a transaction hash.
	// Then, we will get the valid ids from the contract for all of those events.
	// Then, we will corellate the ids we already have (getOwnedTicketIds) and figure out what events they apply to.
	// From there we will display that event and also every ticket that we own for that event.
	// what the hell have I got myself into

	const getEventNameFromId = async (id: bigint) => {
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
	};

	const getEventByUUID = async (UUID: string) => {
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/user/events?ID=${UUID}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${client.auth.token}` }
			}
		);

		if (!resp.ok) {
			console.log('BAD RESP');
			return 'There was an error fetching data';
		}
		return await resp.json();
	};

	async function tmp() {
		const tmp = await getOwnedTicketIds();

		const ids = tmp as bigint[];

		console.log('woah');

		const event_names = Array(ids.length).fill('') as string[];
		let iterator = 0;
		for (const id in ids) {
			event_names[iterator] = await getEventNameFromId(BigInt(id));
			iterator += 1;
		}

		// console.log(event_names);

		const event_data: string[] = [];

		for (let i = 0; i < event_names.length; i++) {
			// console.log(event_names[i]);
			const uuid = event_names[i].split(' ')[5];
			// console.log('uuid',uuid);
			event_data.push(await getEventByUUID(uuid));
		}

		// for (const event in event_names) {
		// 	console.log('event', event)
		// 	const uuid = event.split(" ");
		// 	console.log('uuid',uuid);
		// 	// event_data.push(await getEventByUUID(uuid))
		// }

		console.log(event_data);

		return <Button title="hello world" />;
	}

	// function EventHandler() {

	// 	tmp().then(result => {
	// 		set = true;
	// 		return result;
	// 	})

	// 	return <Text>yay</Text>
	// };

	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			{/* <Text>Home Screen</Text> */}
			{/* <Button title="Go to Profile" onPress={() => navigation.navigate("Profile" as never)}/> */}
			<Button title="test" onPress={tmp} />
			{/* <EventHandler /> */}
		</View>
	);
};

export default HomeScreen;
