import { BaseCommand, args } from '@adonisjs/core/build/standalone'
// Import DB models
import Place from 'App/Models/Place'
import OpenweathermapService from 'App/Services/OpenweathermapService'

export default class DataDelete extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'data:delete'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Delete all data related to the provided city from the database.'

  /**
   * Command CLI arguments
   */
  @args.string({ description: 'Name of the city you want to delete from the database.' })
  public city: string

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
    this.logger.info(`You are deleting data for ${this.city}...`)

    // Fetch city coordinates from Openweathermap API
    const cityData = await OpenweathermapService.getCityCoords(this.city)

    if (!cityData) {
      this.logger.error('Could not find city.')
      return 1
    }
    const { lat, lon } = cityData

    // Delete all places for the city
    const city = await Place.query().where('lat', lat).where('lon', lon).delete()
    if (city[0] === 0) {
      this.logger.error('There are no records in the database for this city.')
      return 1
    }

    this.logger.success(`Deleted all the records from the database.`)
  }
}
