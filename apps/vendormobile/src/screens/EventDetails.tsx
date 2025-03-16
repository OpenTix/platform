import { Event } from '@platform/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Text, View, Image } from 'react-native';
import { Button } from 'react-native-paper';
import { useDynamic } from '../hooks/DynamicSetup';

type Params = {
	EventDetails: {
		Event: string;
	};
};

export default function EventDetails({
	route
}: NativeStackScreenProps<Params, 'EventDetails'>) {
	const client = useDynamic();
	const { Event } = route.params;
	const [view, setView] = useState<React.ReactNode>(null);

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

		const dateUpper =
			new Date().getFullYear() === date.getFullYear()
				? `${dayOfWeek}, ${month} ${day}`
				: `${dayOfWeek}, ${month} ${day}, ${date.getFullYear()}`;
		const dateLower = `${time}`;
		setView(
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<View
					style={{
						flex: 1,
						rowGap: 10,
						alignItems: 'center',
						justifyContent: 'center'
					}}
				>
					<Text>Name: {data.Name}</Text>
					<Text>Cost: ${data.Basecost}</Text>
					<Text>Unique Seats: {data.NumUnique}</Text>
					<Text>General Admission: {data.NumGa}</Text>
					<Text>Event Type: {data.Type}</Text>
					<Text>Description: {data.Description}</Text>
					<Text>Disclaimer: {data.Disclaimer}</Text>
					<View
						style={{
							display: 'flex',
							flexDirection: 'row',
							justifyContent: 'center',
							columnGap: 10
						}}
					>
						<Text>{dateUpper}</Text>
						<Text>{dateLower}</Text>
					</View>
					<Image
						source={{ uri: data.Photo ?? null }}
						style={{
							width: '100%',
							height: undefined,
							aspectRatio: 1,
							maxHeight: 200
						}}
					/>
				</View>
				<View style={{ marginBottom: 30, alignItems: 'center' }}>
					<Button
						onPress={() => console.log("I've been clicked")}
						style={{
							backgroundColor: 'black',
							borderColor: 'black',
							borderRadius: 20,
							width: '50%'
						}}
					>
						<Text style={{ color: 'white' }}>Check in</Text>
					</Button>
				</View>
			</View>
		);
	}, []);

	useEffect(() => {
		getFunc();
	}, []);

	return view;
}
