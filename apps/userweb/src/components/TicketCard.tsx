import { UserEventDetailsResponse } from '@platform/types';
import { Box, Card, Flex, Inset, Text, Button } from '@radix-ui/themes';
import { Avatar } from 'radix-ui';
import { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import TransferTicketsModal from './TransferTicketsModal';

export interface TicketCardProps {
	event: UserEventDetailsResponse;
	ticket: string;
}

export function TicketCard({ event, ticket }: TicketCardProps) {
	const titleRef = useRef<HTMLElement>(null);
	const [titleSize, setTitleSize] = useState(1.2);
	const venueRef = useRef<HTMLElement>(null);
	const [venueSize, setVenueSize] = useState(1);
	const [shouldShowTransferModal, setShouldShowTransferModal] =
		useState<boolean>(false);

	const date = new Date(event.EventDatetime);
	const month = date.toLocaleString('default', { month: 'short' });
	const day = date.getDate();
	const dayOfWeek = date.toLocaleString('default', { weekday: 'short' });
	const time = date.toLocaleString('default', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
	const year = date.toLocaleString('default', { year: 'numeric' });

	const dateUpper =
		new Date().getFullYear() === date.getFullYear()
			? `${dayOfWeek}, ${month} ${day} ${year}`
			: `${dayOfWeek}, ${month} ${day} ${year}`;
	const dateLower = `${time}`;

	useEffect(() => {
		if (!titleRef.current) return;
		if (titleRef.current.getClientRects().length > 1) {
			setTitleSize(titleSize - 0.1);
		}
	}, [titleRef, titleSize]);

	useEffect(() => {
		if (!venueRef.current) return;
		if (venueRef.current.getClientRects().length > 1) {
			setVenueSize(venueSize - 0.1);
		}
	}, [venueRef, venueSize]);

	return (
		<>
			{shouldShowTransferModal && (
				<TransferTicketsModal
					onClose={() => setShouldShowTransferModal(false)}
					TicketID={BigInt(ticket)}
				/>
			)}
			<Card
				asChild
				size="3"
				variant="classic"
				style={{ width: '17em', height: '14.5em' }}
			>
				<Link
					to={`/event/${event.ID}`}
					style={{
						margin: '0',
						padding: '0',
						position: 'relative',
						zIndex: 1
					}}
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
								src={event.Eventphoto}
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
									alt={event.Eventname}
								/>
							</Avatar.Fallback>
						</Avatar.Root>

						<Button
							// chatgpt gave me this and it looks nice so keep
							style={{
								position: 'absolute',
								top: '0.5em', // adjust as needed for spacing
								left: '0.5em', // adjust as needed for spacing
								padding: '0.5em 1em',
								backgroundColor: '#ff6347', // change button color as needed
								color: 'purple',
								border: 'none',
								borderRadius: '5px',
								cursor: 'pointer',
								background: 'white',
								zIndex: 10
							}}
							onClick={(e) => {
								// do not remove these two lines
								// they are required to have the button actually work
								e.preventDefault();
								e.stopPropagation(); // Prevents the click event from triggering the Link's onClick

								console.log('Button clicked');
								setShouldShowTransferModal(true);
							}}
						>
							Transfer
						</Button>
					</Inset>

					<Box mx="2" mt="2" mb="4">
						<Text
							style={{
								fontSize: `${titleSize}em`,
								fontWeight: 'bold'
							}}
							ref={titleRef}
						>
							{event.Eventname}
						</Text>
						<Flex
							justify="between"
							style={{ fontSize: `${venueSize}em` }}
						>
							<Flex direction="column" align="start">
								<Box style={{ textAlign: 'left' }}>
									<Text>{event.Venuename}</Text>
								</Box>
								<Box style={{ textAlign: 'left' }}>
									<Text>#{ticket}</Text>
								</Box>
							</Flex>
							<Flex direction="column" align="end">
								<Box style={{ textAlign: 'right' }}>
									<Text ref={venueRef}>{dateUpper}</Text>
								</Box>
								<Box style={{ textAlign: 'right' }}>
									<Text weight="light">{dateLower}</Text>
								</Box>
							</Flex>
						</Flex>
					</Box>
				</Link>
			</Card>
		</>
	);
}
