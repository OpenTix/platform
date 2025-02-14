
-- name: GetVendorByUuid :one
select * from app.vendor where id = $1 limit 1;

-- name: GetVendorByWallet :one
select * from app.vendor where wallet = $1 limit 1;

-- name: CreateVendor :one
insert into app.vendor (wallet, name) values ($1, $2) returning *;

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
-- select * from app.event event
-- where exists (
--     select * from app.venue venue
--     where (case when $2 then venue.zip = $2 else true end)
-- )
-- and (case when $3 then event.name = $3 else true end)
-- and (case when $4 then event.type = $4 else true end)
-- and (case when $5 then event.basecost <= $5 else true end)
-- and (case when $6 then event.event_datetime >= $6 else true end)
-- limit 5
-- offset (($1::int - 1) * 5);
-- select * from app.event event
-- where exists (
--     select * from app.venue venue
--     where (sqlc.narg('zip') is null or venue.zip = sqlc.narg('zip'))
-- )
-- and (sqlc.narg('name') is null or event.name = sqlc.narg('name'))
-- and (sqlc.narg('type') is null or event.type = sqlc.narg('type'))
-- and (sqlc.narg('basecost') is null or event.basecost <= sqlc.narg('basecost'))
-- and (sqlc.narg('datetime') is null or event.event_datetime >= sqlc.narg('datetime'))
-- limit 5
-- offset (($1::int - 1) * 5);
select * from app.event event
where exists (
    select * from app.venue venue
    where ($2::text = '' or venue.zip = $2::text)
)
and ($3::text = '' or event.name = $3::text)
and ($4::text = '' or event.type = $4::text)
and ($5::double precision = 0.0 or event.basecost <= $5::double precision)
and (event.event_datetime >= $6::datetime)
limit 5
offset (($1::int - 1) * 5);