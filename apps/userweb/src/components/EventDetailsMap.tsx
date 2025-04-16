import { UserEventDetailsResponse } from '@platform/types';
import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import styled from 'styled-components';

export interface EventDetailsMapProps {
	data: UserEventDetailsResponse;
}

const SquareContainer = styled.div`
	position: relative;
	width: 100%;
	padding-top: 100%; /* makes a square */

	.leaflet-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100% !important;
		height: 100% !important;
	}
`;

export default function EventDetailsMap({ data }: EventDetailsMapProps) {
	const [lat, setLat] = useState<number>(0);
	const [lon, setLon] = useState<number>(0);

	const getCoordinates = async () => {
		const streetAddress = data.StreetAddress.replace(' ', '+');
		const city = '+' + data.City.replace(' ', '+');
		const res = await fetch(
			`https://nominatim.openstreetmap.org/search?q=${streetAddress},${city}&format=json&polygon=1&addressdetails=1`
		);
		const json = await res.json();
		if (json && json.length > 0) {
			setLat(Number(json[0].lat));
			setLon(Number(json[0].lon));
		} else {
			console.error('No coordinates found');
		}
	};

	// Force a map resize after a delay if needed.
	const MapResizeHandler = () => {
		const map = useMap();
		useEffect(() => {
			const timer = setTimeout(() => {
				map.invalidateSize();
			}, 300); // slight delay for container sizing
			return () => clearTimeout(timer);
		}, [map]);
		return null;
	};

	const RecenterMap = ({ lat, lon }: { lat: number; lon: number }) => {
		const map = useMap();
		useEffect(() => {
			if (lat !== 0 && lon !== 0) {
				map.setView([lat, lon]);
			}
		}, [lat, lon, map]);
		return null;
	};

	useEffect(() => {
		getCoordinates();
	}, []);

	return (
		<SquareContainer>
			<MapContainer
				center={[lat, lon]}
				zoom={13}
				scrollWheelZoom={true}
				style={{ width: '100%', height: '100%' }}
			>
				<TileLayer
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
					url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
					subdomains="abcd"
					maxZoom={20}
				/>
				<Marker position={[lat, lon]}>
					<Popup>{data.Venuename}</Popup>
				</Marker>
				<MapResizeHandler />
				<RecenterMap lat={lat} lon={lon} />
			</MapContainer>
		</SquareContainer>
	);
}
