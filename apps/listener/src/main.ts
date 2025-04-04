import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
	AmoyWSAddress,
	ContractABI,
	ContractAddress,
	ContractGetEventIdsReturnedMetadata,
	CurrentChain
} from '@platform/blockchain';
import { createPublicClient, webSocket } from 'viem';

const SNSARN = process.env.TICKET_CREATION_TOPIC_ARN;
if (!SNSARN) {
	console.error('TICKET_CREATION_TOPIC_ARN is not set');
	process.exit(1);
}

type TicketCreationSNSMessage = {
	Event: string;
	Contract: string;
	TicketMin: number;
	TicketMax: number;
};

// eslint-disable-next-line
async function HandleEvent(logs: Array<any>, publicClient: any) {
	const snsClient = new SNSClient({});
	for (const log of logs) {
		if (log.eventName === 'Event_Commencement') {
			const { args } = log;
			const event = args.description.split(' - ')[1];

			const data = (await publicClient.readContract({
				abi: ContractABI,
				address: ContractAddress,
				functionName: 'get_event_ids',
				args: [args.description]
			})) as [bigint[], ContractGetEventIdsReturnedMetadata];

			const message: TicketCreationSNSMessage = {
				Event: event,
				Contract: log.address,
				TicketMin: Number(data[1].min),
				TicketMax: Number(data[1].max)
			};
			console.log('Event Commencement:', message);

			const params = {
				Message: JSON.stringify(message),
				TopicArn: SNSARN
			};
			try {
				const data = await snsClient.send(new PublishCommand(params));
				console.log('Message sent to SNS:', data);
			} catch (err) {
				console.error('Error sending message to SNS:', err);
			}
		}
	}
}

async function startWatcher() {
	console.log('Setting up public client.');
	const publicClient = createPublicClient({
		chain: CurrentChain,
		transport: webSocket(AmoyWSAddress)
	});

	console.log('Setting up contract watching.');
	const unwatch = publicClient.watchContractEvent({
		address: ContractAddress,
		abi: ContractABI,
		eventName: 'Event_Commencement',
		onLogs: (logs) => HandleEvent(logs, publicClient),
		onError: (error) => {
			console.error('watcher error:', error);
			throw error;
		}
	});

	console.log('Listening...');

	// This promise never resolves but keeps the function
	// from returning unless an error is thrown.
	// eslint-disable-next-line
	return new Promise<void>((resolve, reject) => {});
}

async function mainLoop() {
	while (true) {
		try {
			console.log('Starting watcher');
			await startWatcher();
		} catch (err) {
			console.error('Error in watcher, restarting in 5 seconds...', err);
			await new Promise((r) => setTimeout(r, 5000));
		}
	}
}

mainLoop();

// HandleEvent(
// 	[
// 		{
// 			address: '0xe30e1f5c14310797cea37be45c5e7445e506c021',
// 			blockHash:
// 				'0x271d318186869d74c91cb4306fa2cd751a4fe850b8dfcf63fc4f5547f3eaaa30',
// 			blockNumber: 19881969n,
// 			data: '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000437465737420617420323032352d30342d30325431363a30303a30305a202d2038373965636332322d313630352d346163332d616463342d3566646136623462656265360000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d68747470733a2f2f6f70656e7469782e636f2f6576656e742f38373965636332322d313630352d346163332d616463342d356664613662346265626536000000',
// 			logIndex: 7,
// 			removed: false,
// 			topics: [
// 				'0x73e344453faa207d9ac2de809547c73b7cf1131a88f1fb01b0893c651c10c40f',
// 				'0x000000000000000000000000b98218cf9bdc576626e2fa562f0a9cb9f10b6143'
// 			],
// 			transactionHash:
// 				'0x7665390cd4719b258833897aa15a608384ac48c23d9c75c078899607c0e386b4',
// 			transactionIndex: 3,
// 			args: {
// 				from: '0xb98218Cf9BDc576626E2Fa562F0a9Cb9F10b6143',
// 				description:
// 					'test at 2025-04-02T16:00:00Z - 879ecc22-1605-4ac3-adc4-5fda6b4bebe6',
// 				venue_URI:
// 					'https://opentix.co/event/879ecc22-1605-4ac3-adc4-5fda6b4bebe6',
// 				capacity: 4n
// 			},
// 			eventName: 'Event_Commencement'
// 		}
// 	],
// 	createPublicClient({
// 		chain: CurrentChain,
// 		transport: webSocket(AmoyWSAddress)
// 	})
// );

/* Event Commencement:

[
  {
    address: '0xe30e1f5c14310797cea37be45c5e7445e506c021',
    blockHash: '0x271d318186869d74c91cb4306fa2cd751a4fe850b8dfcf63fc4f5547f3eaaa30',
    blockNumber: 19881969n,
    data: '0x000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000437465737420617420323032352d30342d30325431363a30303a30305a202d2038373965636332322d313630352d346163332d616463342d3566646136623462656265360000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000003d68747470733a2f2f6f70656e7469782e636f2f6576656e742f38373965636332322d313630352d346163332d616463342d356664613662346265626536000000',
    logIndex: 7,
    removed: false,
    topics: [
      '0x73e344453faa207d9ac2de809547c73b7cf1131a88f1fb01b0893c651c10c40f',
      '0x000000000000000000000000b98218cf9bdc576626e2fa562f0a9cb9f10b6143'
    ],
    transactionHash: '0x7665390cd4719b258833897aa15a608384ac48c23d9c75c078899607c0e386b4',
    transactionIndex: 3,
    args: {
      from: '0xb98218Cf9BDc576626E2Fa562F0a9Cb9F10b6143',
      description: 'test at 2025-04-02T16:00:00Z - 879ecc22-1605-4ac3-adc4-5fda6b4bebe6',
      venue_URI: 'https://opentix.co/event/879ecc22-1605-4ac3-adc4-5fda6b4bebe6',
      capacity: 4n
    },
    eventName: 'Event_Commencement'
  }
]
*/
