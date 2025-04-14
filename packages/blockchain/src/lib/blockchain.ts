import { polygonAmoy } from 'viem/chains';

export const ContractAddress = '0x41c3462A19a267D8F5690D5b411c4e46aCf0bbcB';

export type ContractGetEventIdsReturnedMetadata = {
	min: bigint;
	max: bigint;
	exists: boolean;
};

export const CurrentChain = polygonAmoy;
export const AmoyWSAddress = 'wss://polygon-amoy-bor-rpc.publicnode.com';

export const ContractABI = [
	{ inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
	{
		inputs: [
			{ internalType: 'address', name: 'sender', type: 'address' },
			{ internalType: 'uint256', name: 'balance', type: 'uint256' },
			{ internalType: 'uint256', name: 'needed', type: 'uint256' },
			{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }
		],
		name: 'ERC1155InsufficientBalance',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'approver', type: 'address' }
		],
		name: 'ERC1155InvalidApprover',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: 'idsLength', type: 'uint256' },
			{ internalType: 'uint256', name: 'valuesLength', type: 'uint256' }
		],
		name: 'ERC1155InvalidArrayLength',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'operator', type: 'address' }
		],
		name: 'ERC1155InvalidOperator',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'receiver', type: 'address' }
		],
		name: 'ERC1155InvalidReceiver',
		type: 'error'
	},
	{
		inputs: [{ internalType: 'address', name: 'sender', type: 'address' }],
		name: 'ERC1155InvalidSender',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'operator', type: 'address' },
			{ internalType: 'address', name: 'owner', type: 'address' }
		],
		name: 'ERC1155MissingApprovalForAll',
		type: 'error'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'account',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'operator',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'bool',
				name: 'approved',
				type: 'bool'
			}
		],
		name: 'ApprovalForAll',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'string',
				name: 'description',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'count',
				type: 'uint256'
			}
		],
		name: 'Buy_Ticket_Event',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'from',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'description',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'string',
				name: 'venue_URI',
				type: 'string'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'capacity',
				type: 'uint256'
			}
		],
		name: 'Event_Commencement',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'operator',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'from',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'to',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'uint256[]',
				name: 'ids',
				type: 'uint256[]'
			},
			{
				indexed: false,
				internalType: 'uint256[]',
				name: 'values',
				type: 'uint256[]'
			}
		],
		name: 'TransferBatch',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'operator',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'from',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'to',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'id',
				type: 'uint256'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'value',
				type: 'uint256'
			}
		],
		name: 'TransferSingle',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: 'string',
				name: 'value',
				type: 'string'
			},
			{
				indexed: true,
				internalType: 'uint256',
				name: 'id',
				type: 'uint256'
			}
		],
		name: 'URI',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'seller',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'buyer',
				type: 'address'
			}
		],
		name: 'User_To_User_Transfer_Concluded',
		type: 'event'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: 'ticketid', type: 'uint256' }
		],
		name: 'allow_ticket_to_be_transfered',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'allow_user_to_user_ticket_transfer',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'account', type: 'address' },
			{ internalType: 'uint256', name: 'id', type: 'uint256' }
		],
		name: 'balanceOf',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address[]', name: 'accounts', type: 'address[]' },
			{ internalType: 'uint256[]', name: 'ids', type: 'uint256[]' }
		],
		name: 'balanceOfBatch',
		outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'user', type: 'address' },
			{ internalType: 'uint256', name: 'ticketid', type: 'uint256' }
		],
		name: 'buy_ticket_from_user',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'string',
				name: 'event_description',
				type: 'string'
			},
			{ internalType: 'uint256[]', name: 'ids', type: 'uint256[]' }
		],
		name: 'buy_tickets',
		outputs: [
			{ internalType: 'bool', name: '', type: 'bool' },
			{ internalType: 'uint256', name: '', type: 'uint256' }
		],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'check_ticket_transfer_permission',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: 'ticketid', type: 'uint256' }
		],
		name: 'check_ticket_transferable',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'string', name: 'description', type: 'string' },
			{ internalType: 'string', name: 'vendor_url', type: 'string' },
			{
				internalType: 'uint256',
				name: 'general_admission',
				type: 'uint256'
			},
			{ internalType: 'uint256', name: 'unique_seats', type: 'uint256' },
			{ internalType: 'uint256[]', name: 'costs', type: 'uint256[]' }
		],
		name: 'create_new_event',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: 'ticketid', type: 'uint256' }
		],
		name: 'disallow_ticket_to_be_transfered',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'disallow_user_to_user_ticket_transfer',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256[]', name: 'ids', type: 'uint256[]' }],
		name: 'get_cost_for_tickets',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: 'id', type: 'uint256' }],
		name: 'get_event_description',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'string', name: 'description', type: 'string' }
		],
		name: 'get_event_ids',
		outputs: [
			{ internalType: 'uint256[]', name: '', type: 'uint256[]' },
			{
				components: [
					{ internalType: 'uint256', name: 'min', type: 'uint256' },
					{ internalType: 'uint256', name: 'max', type: 'uint256' },
					{ internalType: 'bool', name: 'exists', type: 'bool' }
				],
				internalType: 'struct Ids',
				name: '',
				type: 'tuple'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'get_events',
		outputs: [{ internalType: 'string[]', name: '', type: 'string[]' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'account', type: 'address' },
			{ internalType: 'address', name: 'operator', type: 'address' }
		],
		name: 'isApprovedForAll',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'string', name: 'description', type: 'string' }
		],
		name: 'is_description_available',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '', type: 'address' },
			{ internalType: 'address', name: '', type: 'address' },
			{ internalType: 'uint256[]', name: '', type: 'uint256[]' },
			{ internalType: 'uint256[]', name: '', type: 'uint256[]' },
			{ internalType: 'bytes', name: '', type: 'bytes' }
		],
		name: 'onERC1155BatchReceived',
		outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '', type: 'address' },
			{ internalType: 'address', name: '', type: 'address' },
			{ internalType: 'uint256', name: '', type: 'uint256' },
			{ internalType: 'uint256', name: '', type: 'uint256' },
			{ internalType: 'bytes', name: '', type: 'bytes' }
		],
		name: 'onERC1155Received',
		outputs: [{ internalType: 'bytes4', name: '', type: 'bytes4' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'from', type: 'address' },
			{ internalType: 'address', name: 'to', type: 'address' },
			{ internalType: 'uint256[]', name: 'ids', type: 'uint256[]' },
			{ internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
			{ internalType: 'bytes', name: 'data', type: 'bytes' }
		],
		name: 'safeBatchTransferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'from', type: 'address' },
			{ internalType: 'address', name: 'to', type: 'address' },
			{ internalType: 'uint256', name: 'id', type: 'uint256' },
			{ internalType: 'uint256', name: 'value', type: 'uint256' },
			{ internalType: 'bytes', name: 'data', type: 'bytes' }
		],
		name: 'safeTransferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'operator', type: 'address' },
			{ internalType: 'bool', name: 'approved', type: 'bool' }
		],
		name: 'setApprovalForAll',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }
		],
		name: 'supportsInterface',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		name: 'uri',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	}
];
