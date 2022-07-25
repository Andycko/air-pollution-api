# Air Pollution API
This API provides you with air pollution data for a certain location. The data is provided by [Openweathermap API](https://openweathermap.org/api).

## API Usage
### Commands
The api provides 2 command line commands to fetch and delete data:
- `data:sync <city> <from> <to>`: Gets pollution data for the provided city in the provided time range.
- `data:delete <city>`: Deletes all data for the provided city.
The above commands can be run by running `node ace <command>`

### Endpoints
The api provides 2 endpoints to get data about pollution (To be able to get some data from these endpoints, you first need to run the `data:sync` command to fetch the data):
- `GET /air-pollution/avg?city=<city>&from=<from>&to=<to>`: Gets the average air pollution data for the provided city in the provided time range.
- `GET /air-pollution/max-city?from=<from>&to=<to>`: Gets the city with the highest air pollution data in the provided time range.

## Development
To run the API locally you will need to have a local PostgresSQL instance running which the app can connect to.

### Dev server
- Build dependencies `yarn install`
- Create a `.env` file and fill in your environment variables based on `.env.example`
- Run the development server using `node ace serve --watch`
- The dev server should now be running on port specified in the `.env` file

### Production Build
- Build dependencies `yarn install`
- Run build command `node ace build --production`
- You will have a production build created in the `./build` folder
- Don't forget to provide the required environment variables for the production build wherever you decide to run it
