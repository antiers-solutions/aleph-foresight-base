# Aleph foresight Backend

This application is the backend server for the Grant Management Webapp.

## Overview

It includes the following features:

- Data dump from github repositories.
- Authentication of users using Github.
- Webhook implementation.
- Pictorial Representation of data

## Installation

Prerequisites:

- Node: [Installation guide](https://nodejs.org/en/download) (v16)
- Docker compose: [Installation guide](https://docs.docker.com/compose/install/)
- Redis: [Installation guide](https://redis.io/docs/getting-started/) (v4.6.7)
- MongoDB: [Installation guide](https://www.mongodb.com/docs/manual/installation/) (v3.6.8)
- TypeScript: `npm install typescript -g` (v4.9.5)

#### Clone this repo using:
```bash
git clone http://repo.antiersolutions.com/malayatr941/aleph-foresight-backend.git
```
```bash
cd aleph-foresight-backend/
``` 
**You can start all the required backend services using docker by using the docker-compose file in the repo. Otherwise, this can also be done manually by following the steps mentioned below.** 
#### Install the dependencies with npm:

```bash
npm install
```
#### Running project using npm:

1. Configure the environment file with the right environment variable:
- Locate the `env.example` file in the repository's root directory.
- Create a copy of `env.example` in `/src/config` and name it `local.env`.
For help in setting up the environment variables refer the [configuration guide](https://github.com/antiers-solutions/gmw-backend/blob/updated/docs/configuration.md).

2. After successfully setting up and running the required services:

```bash
npm start 
```
- While setting up the repo for the first time, the data will be loaded from the json files in `/src/db-dump` directory.
- In case, the application does not find the data from the files in `/src/db-dump` directory, the services will automatically start to load data into local database after you run the `npm start` command. It will take around 30-45 minutes for the data to get processed.
- Upon a successfull data dump, the application will print a log with message "Data Successfully Stored".

#### Run project using docker compose:
1. Configure the environment file with the right environment variable:
- Locate the `env.example` file in the repository's root directory.
- Create a copy of `env.example` in `/src/config` and name it `prod.env`.
For help in setting up the environment variables refer the [configuration guide](https://github.com/antiers-solutions/gmw-backend/blob/updated/docs/configuration.md).

2. After successfully setting up the `prod.env` file:
```bash
docker-compose up -d
```

## Testing Guide
1. Configure the environment file with the right environment variable:
- Locate the `env.example` file in the repository's root directory.
- Create a copy of `env.example` in `/src/config` and name it `test.env`.
**NOTE:-** The `DBNAME` in test.env cannot be same as the `DBNAME` in other environment files.

For help in setting up the environment variables refer the [configuration guide](https://github.com/antiers-solutions/gmw-backend/blob/updated/docs/configuration.md).
#### Run unit tests:
```bash
npm run test 
```
#### Run test cases for APIs:
```bash
npm run test:api
```
#### For unit test coverage:
```bash
npm run test:coverage
```
#### For test case coverage for APIs:
```bash
npm run test:api:coverage
```