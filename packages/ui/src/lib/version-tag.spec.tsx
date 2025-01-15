import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import VersionTag from './version-tag';

describe('VersionTag', () => {
	it('should render successfully', () => {
		const { baseElement } = render(<VersionTag />);
		expect(baseElement).toBeTruthy();
	});

	it('displays the version from the environment variable', () => {
		process.env.NX_PUBLIC_APP_BUILD = '1.0.0';
		const { getByText } = render(<VersionTag />);
		expect(getByText('v1.0.0')).toBeInTheDocument();
	});

	it('displays "vNOT_SET" when the version is not set', () => {
		delete process.env.NX_PUBLIC_APP_BUILD;
		const { getByText } = render(<VersionTag />);
		expect(getByText('vNOT_SET')).toBeInTheDocument();
	});
});
