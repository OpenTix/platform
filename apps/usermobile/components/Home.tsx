import { UserEventResponse } from '@platform/types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
	useQuery,
	QueryClient,
	QueryClientProvider
} from '@tanstack/react-query';
// import { getAuthToken } from '@dynamic-labs/sdk-react-core';
import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { Card, Avatar } from 'react-native-paper';
import { useDynamic } from './DynamicSetup';
import { dynamicClient } from './DynamicSetup';

const queryClient = new QueryClient();

const Stack = createNativeStackNavigator();

export interface HomeModalProps {
	onClose: () => void;
}

export function Home({ onClose }: HomeModalProps) {
	const { auth } = useDynamic();
	const [page, setPage] = useState<number>(1);
	const [zip, setZip] = useState<string>('');
	const [type, setType] = useState<string>('');
	const [ename, setEname] = useState<string>('');
	const [cost, setCost] = useState<number>(1000000);
	const [eventDate, setEventDate] = useState<string>(
		new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
			.toISOString()
			.slice(0, 16)
	);

	function Events() {
		const { isPending, isError, data, error } = useQuery({
			queryKey: ['events'],
			queryFn: getEvents
		});

		if (isPending) {
			return <Text> Loading... </Text>;
		}

		if (isError) {
			console.error(error.message);
			return <Text>Error: {error.message}</Text>;
		}

		return (
			data?.map((data: UserEventResponse, idx: number) => {
				const keys = Object.keys(data);
				console.log(keys);
				let photo_uri = '';
				return (
					<Card key={idx}>
						{/* <Link to={`/event/${data.ID}`}> */}
						{/* <Flex direction="column"> */}
						{Object.values(data)?.map(
							(value: string | number, idx: number) => {
								if (keys[idx] === 'Photo') {
									photo_uri = value as string;
									return null;
								} else if (keys[idx] === 'ID') {
									return null;
								}
								return (
									<Text key={idx}>
										{keys[idx]}:{' '}
										{keys[idx] === 'EventDatetime'
											? new Date(value).toLocaleString()
											: keys[idx] === 'Basecost'
												? `$${value}`
												: value}
									</Text>
								);
							}
						)}
						<Avatar.Image
							source={{ uri: photo_uri }}
							// label={"Image of venue"}
						/>
						{/* </Flex> */}
						{/* </Link> */}
					</Card>
				);
			}) ?? (
				<Card>
					<Text>There are no results for page {page}</Text>
				</Card>
			)
		);
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value, type } = e.target;
		switch (name) {
			case 'Type':
				setType(value);
				break;
			case 'Cost':
				setCost(Number(value));
				break;
			case 'Time':
				setEventDate(value);
				break;
			case 'Zip':
				setZip(value);
				break;
			case 'Name':
				setEname(value);
				break;
			default:
				break;
		}
	};

	async function getEvents() {
		const authToken = auth.token;
		const resp = await fetch(
			`${process.env.EXPO_PUBLIC_API_BASEURL}/user/events?Page=${page}&Zip=${zip}&Type=${type}&Name=${ename}&Basecost=${cost}&EventDatetime=${new Date(eventDate).toISOString()}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${authToken}` }
			}
		);
		if (!resp.ok) return Error('There was an error fetching data');
		return await resp.json();
	}

	return (
		<>
			<View>
				<Text>Test:</Text>
				<Text>{JSON.stringify(auth.authenticatedUser, null, 2)}</Text>
			</View>
			<Button
				title="Profile"
				onPress={() => {
					dynamicClient.ui.userProfile.show();
				}}
			/>
			<Button
				title="Logout"
				onPress={() => {
					auth.logout();
					onClose();
				}}
			/>

			<View>
				<QueryClientProvider client={queryClient}>
					<Events />
				</QueryClientProvider>
			</View>
		</>
	);
}
