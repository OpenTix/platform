import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { SamlConsolePrincipal } from 'aws-cdk-lib/aws-iam';
import test from 'node:test';
import { useEffect, useState } from 'react';
import {
	GetContractReturnType,
	PublicClient,
	WalletClient,
	getContract
} from 'viem';

const abijson = [
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
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'string', name: 'description', type: 'string' }
		],
		name: 'get_event_ids',
		outputs: [{ internalType: 'uint256[]', name: '', type: 'uint256[]' }],
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

export default function ContractTesting() {
	const { primaryWallet } = useDynamicContext();

	const getFromContract = async () => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = await p.readContract({
						abi: abijson,
						address: '0xeB60D2D16F2D48324C84D9ffB26465A88d40659f',
						functionName: 'get_events'
					});
					console.log(data);
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
	};

	const mint = async () => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const { request } = await p.simulateContract({
						abi: abijson,
						address: '0xeB60D2D16F2D48324C84D9ffB26465A88d40659f',
						functionName: 'create_new_event',
						account: w.account,
						args: [
							'dummy description 3',
							'http://dummyurl.com',
							2,
							2,
							[
								1000000000000000, 1000000000000000,
								1000000000000000, 1000000000000000
							]
						]
					});
					console.log(request);
					const hash = await w.writeContract(request);
					console.log(hash);
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
	};

	const buy = async () => {
		if (primaryWallet && isEthereumWallet(primaryWallet)) {
			try {
				const w = await primaryWallet.getWalletClient();
				const p = await primaryWallet.getPublicClient();

				if (w && p) {
					const data = await p.readContract({
						abi: abijson,
						address: '0xeB60D2D16F2D48324C84D9ffB26465A88d40659f',
						functionName: 'get_event_ids',
						args: ['dummy description 3']
					});
					console.log(data);

					const { request } = await p.simulateContract({
						abi: abijson,
						address: '0xeB60D2D16F2D48324C84D9ffB26465A88d40659f',
						functionName: 'buy_tickets',
						account: w.account,
						args: ['dummy description 3', [8]],
						value: BigInt(1000000000000000)
					});
					// console.log(request);
					const gas = await p.estimateContractGas(request);
					console.log(gas);
					const hash = await w.writeContract(request);
					console.log(hash);
				} else {
					console.error('Wallet client or public client not set up');
				}
			} catch (error) {
				console.error('Error setting up wallet client', error);
			}
		}
	};

	return (
		<div>
			<button onClick={getFromContract}>Get From Contract</button>
			<button onClick={mint}>Mint</button>
			<button onClick={buy}>Buy</button>
		</div>
	);
}
