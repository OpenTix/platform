// Redone to align with database.
export type Event = {
	id: string;
	vendor: number;
	venue: number;
	name: string;
	type: string;
	event_datetime: string;
	description: string;
	disclaimer: string;
	basecost: number;
	num_unique: number;
	num_ga: number;
	photo: string;
};

export type Venue = {
	id: string;
	vendor: number;
	name: string;
	street_address: string;
	zip: string;
	city: string;
	state_code: string;
	state_name: string;
	country_code: string;
	country_name: string;
	num_unique: number;
	num_ga: number;
	photo: string;
};

export type EventCreationFormData = Pick<
	Event,
	| 'venue'
	| 'name'
	| 'type'
	| 'event_datetime'
	| 'description'
	| 'disclaimer'
	| 'basecost'
	| 'num_unique'
	| 'num_ga'
>;

export type VenueCreationFormData = Pick<
	Venue,
	| 'name'
	| 'street_address'
	| 'zip'
	| 'city'
	| 'state_code'
	| 'state_name'
	| 'country_code'
	| 'country_name'
	| 'num_unique'
	| 'num_ga'
>;
