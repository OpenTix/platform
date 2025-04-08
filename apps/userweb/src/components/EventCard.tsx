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

	const dateUpper = `${month} ${day}, ${date.getFullYear()}`;
	const dateLower = `${dayOfWeek} ${time}`;

	return (
		<Card
			asChild
			size="3"
			variant="classic"
			style={{ width: '17em', height: '14.5em' }}
		>
			<Link
				to={`/event/${event.ID}`}
				style={{ margin: '0', padding: '0' }}
			>
				<Inset
					clip="padding-box"
					side="top"
					style={{ height: '10em', alignContent: 'center' }}
				>
					<Avatar.Root>
						<Avatar.Image
							style={{
								display: 'block',
								objectFit: 'cover',
								width: '100%',
								maxHeight: '10em'
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
									maxHeight: '10em'
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
							fontSize: `1em`,
							fontWeight: 'bold'
						}}
					>
						{event.Name}
					</Text>
					<Flex justify="between">
						<Box style={{ width: '60%', fontSize: `.85em` }}>
							<Text>{event.Venuename}</Text>
						</Box>
						<Flex direction="column" align="end">
							<Box
								style={{
									textAlign: 'right',
									fontSize: `.85em`
								}}
							>
								<Text>{dateUpper}</Text>
							</Box>
							<Box
								style={{
									textAlign: 'right',
									fontSize: `.85em`
								}}
							>
								<Text weight="light">{dateLower}</Text>
							</Box>
						</Flex>
					</Flex>
				</Box>
			</Link>
		</Card>
	);
}
