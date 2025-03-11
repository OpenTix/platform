import { createClient } from '@dynamic-labs/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';

if (!process.env.EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
	throw new Error('Missing Dynamic Environment ID');
}

export const dynamicClient = createClient({
	environmentId: process.env.EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID,

	// Optional:
	// //   appLogoUrl: 'https://demo.dynamic.xyz/favicon-32x32.png',
	appName: 'OpenTix User Mobile'
})
	.extend(ReactNativeExtension())
	.extend(ViemExtension());

export const useDynamic = () => useReactiveClient(dynamicClient);
