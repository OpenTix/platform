
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

-- name: GetVenuesPaginated :many
select * from app.venue venue
where venue.vendor = (
    select pk from app.vendor vendor
    where vendor.wallet = $2
)
limit 5
offset (($1::int - 1) * 5);

-- name: CreateVenue :one
insert into app.venue (
    name,
    streetaddr,
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
    streetaddr,
    zip,
    city,
    state_code,
    country_code,
    country_name,
    num_unique,
    num_ga
);

-- name: GetEventsPaginated :many
select * from app.event event
where exists (
    select * from app.venue venue
    where ($2::text = '' or venue.zip = $2::text)
)
and ($3::text = '' or event.name = $3::text)
and ($4::text = '' or event.type = $4::text)
and ($5::double precision = 0.0 or event.basecost <= $5::double precision)
and (event.event_datetime >= $6::timestamp)
limit 5
offset (($1::int - 1) * 5);