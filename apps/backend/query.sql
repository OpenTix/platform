
-- name: GetVendorByUuid :one
select * from app.vendor where id = $1 limit 1;

-- name: GetVendorByWallet :one
select * from app.vendor where wallet = $1 limit 1;

-- name: CreateVendor :one
insert into app.vendor (wallet, name) values ($1, $2) returning *;

-- name: UpdateVendorName :one
update app.vendor set name = $2 where wallet = $1 returning *;

-- name: GetVenuesPaginated :many
select * from app.venue where wallet = $1 limit 5 offset (($2 - 1) * 5);

-- name: GetEventsPaginated :many
select * from app.event inner join app.venue v where ($2 is null or v.zip = $2) and ($3 is null or name = $3) and ($4 is null or type = $4) and ($5 is null or basecost <= $5) and (limit 5 offset(($1 - 1) * 5));