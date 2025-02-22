import { useRouteError } from 'react-router-dom';

export interface ErrorPageProps {
	is404?: boolean;
	fatal?: boolean;
}

export function ErrorPage(ErrorPageProps: ErrorPageProps) {
	//eslint-disable-next-line @typescript-eslint/no-explicit-any
	const error: any = useRouteError();
	console.error(error);

	return (
		<div id="error-page">
			<h1>Yikes!</h1>
			<p>
				Sorry, {ErrorPageProps.fatal ? 'a fatal' : 'an unexpected'}{' '}
				error has occurred.
			</p>
			<p>
				{error && <i>{error.statusText || error.message}</i>}
				{ErrorPageProps.is404 && <i>Page not found</i>}
			</p>
		</div>
	);
}
