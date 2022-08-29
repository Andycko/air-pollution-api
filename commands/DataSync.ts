import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Place from 'App/Models/Place'
import Record from 'App/Models/Record'
import OpenweathermapService from 'App/Services/OpenweathermapService'

export default class DataSync extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'data:sync'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Sync air-pollution data from Openweathermap API'

  /**
   * Command CLI arguments
   */
  @args.string({ description: 'Name of the city to sync data for.' })
  public city: string

  @args.string({ description: 'The date to sync data from.' })
  public from: string

  @args.string({ description: 'The date to sync data to.' })
  public to: string

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command. Don't forget to call `node ace generate:manifest`
     * afterwards.
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process. Don't forget to call
     * `node ace generate:manifest` afterwards.
     */
    stayAlive: false,
  }

  public async run() {
    // Declare some consts
    const DAY = 1000 * 60 * 60 * 24

    // Parse dates
    const from = new Date(this.from)
    const to = new Date(this.to)

    this.logger.info(`You are syncing data for ${this.city} - ${from} -> ${to}...`)

    // Fetch city coordinates from Openweathermap API
    const cityData = await OpenweathermapService.getCityCoords(this.city)

    if (!cityData) {
      this.logger.error('Could not find city.')
      return 1
    }
    const { lat, lon } = cityData
    this.logger.info(`Found coordinates for ${this.city}: ${lat} ${lon}.`)

    // Check if city exists in database
    // if city doesn't exist, create it
    const place = await Place.firstOrCreate({ lat, lon }, { lat, lon })

    // if the user is requesting data for more than 1 day, we need to fetch data for each day
    let remainingTime = to.getTime() - from.getTime()
    const days = Math.floor(remainingTime / DAY)
    let tmpFrom = from

    for (let i = 0; i < days; i++) {
      // fetch data for 1 day
      const tmpTo = new Date(tmpFrom.getTime() + DAY)

      // Perform data fetching and saving
      await this.fetchAndSavePollutionData(place, tmpFrom, tmpTo)

      // Increment tmpFrom by a day
      tmpFrom = new Date(tmpFrom.getTime() + DAY)
      // Decrement a day from the remaining time
      remainingTime -= DAY
    }

    // If there is some residual time which is less than a day, fetch data for that time
    if (remainingTime > 0)
      await this.fetchAndSavePollutionData(
        place,
        tmpFrom,
        new Date(tmpFrom.getTime() + remainingTime)
      )

    this.logger.success(
      `Successfully synced data to the database for ${this.city} - ${from} -> ${to}.`
    )
  }

  private async fetchAndSavePollutionData(place: Place, from: Date, to: Date): Promise<void> {
    this.logger.info(`Fetching batch data for ${from} -> ${to}...`)

    const response = await OpenweathermapService.getPollutionData(place, from, to)

    if (!response) {
      this.logger.error('Could not fetch pollution data. Skipping to next one.')
      return
    }

    if (response.list.length === 0) {
      this.logger.error(
        'Could not find any pollution data for that time period. Skipping to next one.'
      )
      return
    }

    this.logger.success(`Fetched polution data.`)

    // create record for each object in res
    for (let element of response.list) {
      const record: Partial<Record> = {
        dt: new Date(element.dt),
        place_id: place!.id,
        aqi: element.main.aqi,
        co: element.components.co,
        no: element.components.no,
        no_2: element.components.no2,
        o_3: element.components.o3,
        so_2: element.components.so2,
        pm_2_5: element.components.pm2_5,
        pm_10: element.components.pm10,
        nh_3: element.components.nh3,
      }
      try {
        await Record.firstOrCreate({ dt: new Date(element.dt), place_id: place!.id }, record)
      } catch (error) {
        this.logger.debug(error.message)
        this.logger.error('Could not save record to database. Skipping to next one.')
      }
    }
  }
}
