import { BaseCommand, args } from '@adonisjs/core/build/standalone'
import Place from 'App/Models/Place'
import Record from 'App/Models/Record'
import OpenweathermapService from 'App/Services/OpenweathermapService'
import DataService from 'App/Services/DataService'

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
    const dataService = new DataService(this.logger)
    try {
      await dataService.syncData(this.city, new Date(this.from), new Date(this.to))
    } catch (error) {
      this.logger.error(error.message)
    }
  }
}
