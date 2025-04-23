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

	// console.log(`url(${data.Eventphoto || fallbackURL}), url(${fallbackURL})`);

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
							fontSize: '10',
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
				>
					{/* <Image
						src={URI}
						alt="Event"
						style={{
							width: '10%',
							height: '10%',
							objectFit: 'contain',
							// display: 'block'
                            borderRadius: '10px'
						}}
					></Image> */}
				</View>
			</View>
			{/* <Box position="relative" m="8" maxWidth={'35em'}>
				<Flex direction="row" gap="5" align={'center'}>
					<img
						src={data.Eventphoto || fallbackURL}
						alt="Event"
						style={{
							width: '10em',
							height: '10em',
							objectFit: 'contain',
							display: 'block',
							borderRadius: '10px'
						}}
					/>
					<Box>
						<Heading size="3" mb="3" style={{ color: '#fff' }}>
							{data.Type}
						</Heading>
						<Heading size="8" style={{ color: '#fff' }}>
							{data.Eventname}
						</Heading>
						<br />
						<Heading size="2" mt="3" style={{ color: '#fff' }}>
							{dayOfWeek}, {month} {day},{' '}
							{eventDate.getFullYear()} • {time}
						</Heading>
					</Box>
				</Flex>
			</Box> */}
		</View>
	);
}
