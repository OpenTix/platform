-- name: GetVendorByUuid :one
select * from app.vendor where id = $1 limit 1;

-- name: GetVendorByWallet :one
select * from app.vendor where wallet = $1 limit 1;

-- name: CreateVendor :one
insert into app.vendor (wallet, name) values ($1, $2) returning *;

-- name: CreateVendorWithUUID :one
insert into app.vendor (id, wallet, name) values ($1, $2, $3) returning *;

-- name: UpdateVendorName :one
update app.vendor set name = $2 where wallet = $1 returning *;

-- name: CheckVenueVendorStatus :one
select vendor from app.venue
where pk = $1::int;

-- name: VendorGetVenuesPaginated :many
select * from app.venue venue
where venue.vendor = (
    select pk from app.vendor vendor
    where vendor.wallet = $2
)
limit 5
offset (($1::int - 1) * 5);

-- name: VendorGetVenueByPk :one
select * from app.venue 
where venue.pk = $1 
and venue.vendor = (
    select pk from app.vendor
    where wallet = $2
)
limit 1;

-- name: VendorGetVenueByUuid :one
select * from app.venue 
where venue.id = $1 
and venue.vendor = (
    select pk from app.vendor
    where wallet = $2
)
limit 1;

-- name: VendorGetAllVenues :many
select venue.pk, venue.id, venue.name from app.venue
where venue.vendor = (
    select pk from app.vendor
    where wallet = $1
);

-- name: VendorGetEventsPaginated :many
select * from app.event event
where event.vendor = (
    select pk from app.vendor vendor
    where vendor.wallet = $2
)
and ($3::int = -1 or $3::int = event.venue)
limit 5
offset (($1::int - 1) * 5);

-- name: VendorGetEventByPk :one
select * from app.event event
where event.pk = $1
and event.vendor = (
    select pk from app.vendor
    where wallet = $2
)
limit 1;

-- name: VendorGetEventByUuid :one
select * from app.event event
where event.id = $1
and event.vendor = (
    select pk from app.vendor
    where wallet = $2
)
limit 1;

-- name: CreateEvent :one
insert into app.event (
    vendor,
    venue,
    name,
    type,
    event_datetime,
    description,
    disclaimer,
    basecost,
    num_unique,
    num_ga,
    photo
) values (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) returning (
    name,
    type,
    event_datetime,
    description,
    disclaimer,
    basecost,
    num_unique,
    num_ga
);

-- name: CreateVenue :one
insert into app.venue (
    name,
    street_address,
    zip,
    city,
    state_code,
    state_name,
    country_code,
    country_name,
    num_unique,
    num_ga,
    vendor
) values (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) returning (
    name,
    street_address,
    zip,
    city,
    state_code,
    country_code,
    country_name,
    num_unique,
    num_ga
);

-- name: UserGetEventsPaginated :many
select event.name, event.type, event.basecost, event.event_datetime, event.description, event.disclaimer, event.num_unique, event.num_ga, event.photo, venue.zip, venue.street_address
from app.event event, app.venue venue
where event.venue = venue.pk
and ($2::text = '' or $2::text = venue.zip)
and ($3::text = '' or $3::text = event.name)
and ($4::text = '' or $4::text = event.type)
and ($5::double precision >= event.basecost)
and ($6::timestamp <= event.event_datetime)
order by event.event_datetime, event.name
limit 5
offset (($1::int - 1) * 5);
