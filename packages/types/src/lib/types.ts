export type Event = {
	Pk: number;
	ID: string;
	Vendor: number;
	Venue: number;
	Name: string;
	Type: string;
	EventDatetime: string;
	Description: string;
	Disclaimer: string;
	Basecost: number;
	NumUnique: number;
	NumGa: number;
	Photo: string;
	TransactionHash: string;
};

export type Venue = {
	Pk: number;
	ID: string;
	Vendor: number;
	Name: string;
	StreetAddress: string;
	Zip: string;
	City: string;
	StateCode: string;
	StateName: string;
	CountryCode: string;
	CountryName: string;
	NumUnique: number;
	NumGa: number;
	Photo: string;
};

export type UserEventResponse = Pick<
	Event,
	'Name' | 'Type' | 'EventDatetime' | 'Photo' | 'ID'
> &
	Pick<Venue, 'StateCode' | 'CountryCode'>;

export type UserEventDetailsResponse = Omit<
	Event,
	'Pk' | 'Vendor' | 'Venue' | 'TransactionHash' | 'Name' | 'Photo'
> &
	Pick<
		Venue,
		| 'StreetAddress'
		| 'Zip'
		| 'City'
		| 'CountryCode'
		| 'StateCode'
		| 'CountryName'
	> & {
		Vendorname: string;
		Venuename: string;
		Venuephoto: string;
		Eventname: string;
		Eventphoto: string;
	};

export type EventCreationFormData = Pick<
	Event,
	| 'Venue'
	| 'Name'
	| 'Type'
	| 'EventDatetime'
	| 'Description'
	| 'Disclaimer'
	| 'Basecost'
	| 'NumUnique'
	| 'NumGa'
>;

export type VenueCreationFormData = Pick<
	Venue,
	| 'Name'
	| 'StreetAddress'
	| 'Zip'
	| 'City'
	| 'StateCode'
	| 'StateName'
	| 'CountryCode'
	| 'CountryName'
	| 'NumUnique'
	| 'NumGa'
>;

export type EventEditableFields = Pick<
	Event,
	'Type' | 'Description' | 'Disclaimer'
>;

export type VenueEditableFields = Pick<
	Venue,
	| 'Name'
	| 'StreetAddress'
	| 'Zip'
	| 'City'
	| 'StateCode'
	| 'StateName'
	| 'CountryCode'
	| 'CountryName'
>;

export type AllVenuesListSimplifiedResponse = Pick<Venue, 'Pk' | 'ID' | 'Name'>;

const EVENT_DEFAULT_DO_NOT_USE: Event = {
	Pk: 0,
	ID: '',
	Vendor: 0,
	Venue: 0,
	Name: '',
	Type: '',
	EventDatetime: '',
	Description: '',
	Disclaimer: '',
	Basecost: 0,
	NumUnique: 0,
	NumGa: 0,
	Photo: '',
	TransactionHash: ''
};

const VENUE_DEFAULT_DO_NOT_USE: Venue = {
	Pk: 0,
	ID: '',
	Vendor: 0,
	Name: '',
	StreetAddress: '',
	Zip: '',
	City: '',
	StateCode: '',
	StateName: '',
	CountryCode: '',
	CountryName: '',
	NumUnique: 0,
	NumGa: 0,
	Photo: ''
};

export const EVENT_KEYS = Object.keys(
	EVENT_DEFAULT_DO_NOT_USE
) as (keyof Event)[];
export const VENUE_KEYS = Object.keys(
	VENUE_DEFAULT_DO_NOT_USE
) as (keyof Venue)[];
