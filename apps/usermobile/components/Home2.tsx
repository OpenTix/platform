import { useNavigation } from '@react-navigation/native';
import { View, Button } from 'react-native';
import { useDynamic } from './DynamicSetup';

const HomeScreen = () => {
	// const navigation = useNavigation();
	const client = useDynamic();

	async function getNFTsInWallet() {
		// const url = `https://www.oklink.com/api/v5/explorer/address/token-transaction-list-multi?chainShortName=amoy_testnet&address=${client.auth.authenticatedUser?.verifiedCredentials[0].address}&tokenContractAddress=0x578d05ef4BDC8Ee7f0d23b3130BE5F130f88ab29&endBlockHeight=999999999&startBlockHeight=0&limit=100`;
		const url = `https://www.oklink.com/api/v5/explorer/nft/address-balance-fills?chainShortName=amoy_testnet&address=${client.auth.authenticatedUser?.verifiedCredentials[0].address}&tokenContractAddress=0x578d05ef4BDC8Ee7f0d23b3130BE5F130f88ab29&limit=100&protocolType=token_1155`;
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

	return (
		<View
			style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
		>
			{/* <Text>Home Screen</Text> */}
			{/* <Button title="Go to Profile" onPress={() => navigation.navigate("Profile" as never)}/> */}
			<Button title="test" onPress={getOwnedTicketIds} />
		</View>
	);
};

export default HomeScreen;
