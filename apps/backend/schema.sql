CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create schema app;

create table app."user" (
    pk integer generated always as identity
        constraint user_pk primary key,    
    wallet varchar(40) not null 
        constraint user_wallet unique
        constraint user_wallet_fmt            
            check ((wallet)::text ~ '^[0-9A-Fa-f]{40}$'::text),    
    darkmode boolean default false
);

create table app.vendor (
    pk integer generated always as identity
        constraint vendor_pk primary key,
    id uuid not null 
        default uuid_generate_v4()
        constraint vendor_id unique,
    wallet varchar(40) not null
        constraint vendor_wallet unique
        constraint vendor_wallet_fmt
            check((wallet)::text ~ '^[0-9A-F-a-f]{40}$'::text),
    name text not null
);


create table app.venue (
    pk integer generated always as identity
        constraint venue_pk primary key,
    id uuid not null 
        default uuid_generate_v4()
        constraint venue_id unique,
    vendor integer not null
        constraint venue_vendor_pk_fk
            references app.vendor
            on delete cascade,
    name text not null,
    streetaddr text not null,
    zip text not null,
    city text not null,
    state_code varchar(5) not null
        constraint venue_state_code_check
            check ((state_code)::text ~ '^[A-Z]{2}-[A-Z]{2}$'::text),
    state_name text not null,
    country_code varchar(2) not null
        constraint venue_country_code_check
            check ((country_code)::text ~ '^[A-Z]{2}$'::text),
    country_name text not null,
    num_unique integer not null,
    num_ga integer not null,
    photo text
);


create table app.event(
    pk integer generated always as identity
        constraint event_pk primary key,
    id uuid not null 
        default uuid_generate_v4()
        constraint event_id unique,
    vendor integer not null 
        constraint event_vendor_pk_fk
            references app.vendor
            on delete cascade,
    venue integer not null 
        constraint event_venue_pk_fk
            references app.venue 
            on delete cascade,
    name text not null,
    type text not null,
    event_datetime timestamp not null,
    description text not null,
    disclaimer text,
    basecost double precision not null,
    num_unique integer not null,
    num_ga integer not null,
    photo text
);

