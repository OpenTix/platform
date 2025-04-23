import { createClient } from '@dynamic-labs/client';
import { useReactiveClient } from '@dynamic-labs/react-hooks';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';
import { LightTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import * as colors from '../constants/colors';

if (!process.env.EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID) {
	throw new Error('Missing Dynamic Environment ID');
}

const DarkTheme = {
	colors: {
		background: colors.darkBackground,
		border: 'rgb(0, 0, 0)',
		card: 'rgb(0, 0, 0)',
		notification: 'rgb(255, 255, 255)',
		primary: 'rgb(255, 255, 255)',
		text: 'rgb(229, 229, 231)'
	},
	dark: true,
	fonts: {
		bold: { fontFamily: 'sans-serif', fontWeight: '600' },
		heavy: { fontFamily: 'sans-serif', fontWeight: '700' },
		medium: { fontFamily: 'sans-serif-medium', fontWeight: 'normal' },
		regular: { fontFamily: 'sans-serif', fontWeight: 'normal' }
	}
};

function gettheme() {
	const is_dark = useColorScheme() === 'dark';
	const ret = is_dark ? DarkTheme : LightTheme;
	return ret;
}

export const dynamicClient = createClient({
	environmentId: process.env.EXPO_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
	cssOverrides: `background: colors.darkBackground`,

	// Optional:
	// //   appLogoUrl: 'https://demo.dynamic.xyz/favicon-32x32.png',
	appName: 'OpenTix User Mobile'
})
	.extend(ReactNativeExtension())
	.extend(ViemExtension());

export const useDynamic = () => useReactiveClient(dynamicClient);
