import { UserEventDetailsResponse } from '@platform/types';
import React from 'react';
import { ImageBackground, View, Text, SafeAreaView, Image } from 'react-native';

// import { Heading } from "@radix-ui/themes";

export interface EventViewHeaderProps {
	data: UserEventDetailsResponse;
	ticketid: string;
}

export default function EventViewHeader({
	data,
	ticketid
}: EventViewHeaderProps) {
	const fallbackURL =
		'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg';

	const eventDate = new Date(data.EventDatetime);
	const month = eventDate.toLocaleString('default', { month: 'short' });
	const day = eventDate.getDate();
	const dayOfWeek = eventDate.toLocaleString('default', { weekday: 'long' });
	const time = eventDate.toLocaleString('default', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});

	const URI = data.Eventphoto ? data.Eventphoto : fallbackURL;

	return (
		<View
			style={{
				width: '100%',
				position: 'relative',
				height: '30%',
				overflow: 'hidden'
			}}
		>
			<ImageBackground
				source={{ uri: URI }}
				resizeMode="cover"
				blurRadius={6}
				style={{
					width: '100%',
					height: '100%',
					alignItems: 'center'
				}}
			>
				<View
					style={{
						position: 'absolute',
						flex: 1,
						height: '100%',
						width: '100%',
						backgroundColor: 'rgba(0,0,0, 0.50)',
						justifyContent: 'center'
					}}
				>
					<Text
						style={{
							width: '100%',
							fontSize: 40,
							fontWeight: 'bold',
							color: '#fff'
						}}
					>
						{data.Eventname}
					</Text>
					<Text
						style={{
							fontSize: 15,
							fontWeight: 'bold',
							color: '#fff'
						}}
					>
						{data.Type}
					</Text>
					<Text
						style={{
							fontSize: 12,
							fontWeight: 'bold',
							color: '#fff'
						}}
					>
						{dayOfWeek}, {month} {day}, {eventDate.getFullYear()} •{' '}
						{time}
					</Text>
					<Text
						style={{
							color: '#fff',
							fontSize: 10,
							fontWeight: 'bold'
						}}
					>
						Ticket #{ticketid}
					</Text>
				</View>
			</ImageBackground>

			<View style={{ position: 'relative', margin: 8, maxWidth: '35%' }}>
				<View
					style={{
						flex: 1,
						flexDirection: 'row',
						gap: 5,
						alignItems: 'center'
					}}
				></View>
			</View>
		</View>
	);
}
