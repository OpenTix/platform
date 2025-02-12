
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
offset (($1 - 1) * 5);

-- name: GetEventsPaginated :many
select * from app.event event
where exists (
    select * from app.venue venue
    where ($2 is null or $2 = venue.zip)
)
and ($3 is null or event.name = $3)
and ($4 is null or event.type = $4)
and ($5 is null or event.basecost <= $5)
and ($6 is null or event.event_datetime >= $6)
limit 5
offset (($1 - 1) * 5);