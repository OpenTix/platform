import { UserEventResponse } from '@platform/types';
import { Box, Card, Flex, Inset, Text } from '@radix-ui/themes';
import { Avatar } from 'radix-ui';
import { Link } from 'react-router-dom';

export interface EventCardProps {
	event: UserEventResponse;
}

export function EventCard({ event }: EventCardProps) {
	const date = new Date(event.EventDatetime);
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

	return (
		<Card asChild size="3" variant="classic" style={{ minWidth: '20em' }}>
			<Link
				to={`/event/${event.ID}`}
				style={{ margin: '0', padding: '0' }}
			>
				<Inset
					clip="padding-box"
					side="top"
					style={{ height: '168.75px', alignContent: 'center' }}
				>
					<Avatar.Root>
						<Avatar.Image
							style={{
								display: 'block',
								objectFit: 'cover',
								width: '100%',
								maxHeight: '168.75px'
							}}
							src={event.Photo}
							alt="Image of venue"
						/>
						<Avatar.Fallback>
							<img
								style={{
									display: 'block',
									objectFit: 'cover',
									width: '100%',
									maxHeight: '168.75px'
								}}
								src={
									'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?cs=srgb&dl=pexels-vishnurnair-1105666.jpg&fm=jpg'
								}
								alt={event.Name}
							/>
						</Avatar.Fallback>
					</Avatar.Root>
				</Inset>

				<Box mx="2" mt="2" mb="4">
					<Text
						style={{
							fontSize: '1.2em',
							fontWeight: 'bold'
						}}
					>
						{event.Name}
					</Text>
					<Flex justify="between">
						<Text>{event.Venuename}</Text>
						<Flex direction="column" align="end">
							<Text>{dateUpper}</Text>
							<Text size="2" weight="light">
								{dateLower}
							</Text>
						</Flex>
					</Flex>
				</Box>
			</Link>
		</Card>
	);
}
