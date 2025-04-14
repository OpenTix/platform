import { UserEventDetailsResponse } from '@platform/types';
import { Box, Flex, Heading } from '@radix-ui/themes';

export interface EventDetailsHeaderProps {
	data: UserEventDetailsResponse;
}

export default function EventDetailsHeader({ data }: EventDetailsHeaderProps) {
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

	return (
		<Box width="100%" position="relative" height="15em" overflow="hidden">
			<Box
				position="absolute"
				top="0"
				left="0"
				width="100%"
				height="100%"
				style={{
					backgroundImage: `url(${data.Eventphoto || fallbackURL}), url(${fallbackURL})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					filter: 'blur(8px) brightness(0.5)',
					transform: 'scale(1.2)'
				}}
			/>

			<Box position="relative" m="8" maxWidth={'35em'}>
				<Flex direction="row" gap="5" align={'center'}>
					<img
						src={data.Eventphoto || fallbackURL}
						alt="Event"
						style={{
							width: '10em',
							height: '10em',
							objectFit: 'contain',
							display: 'block',
							borderRadius: '5px'
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
			</Box>
		</Box>
	);
}
