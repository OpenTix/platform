import styled from 'styled-components';

const Tag = styled.div`
	bottom: 0;
	padding: 0.5rem;
	font-size: 0.75rem;
	color: #6c757d;
	z-index: 1000;
`;

export function VersionTag() {
	return process.env.NX_PUBLIC_APP_BUILD ? (
		<Tag>v{process.env.NX_PUBLIC_APP_BUILD}</Tag>
	) : (
		<Tag>vNOT_SET</Tag>
	);
}

export default VersionTag;
