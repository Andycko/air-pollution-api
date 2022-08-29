import OpenweathermapService from 'App/Services/OpenweathermapService'
import Place from 'App/Models/Place'
import Record from 'App/Models/Record'
import { LoggerContract } from '@ioc:Adonis/Core/Logger'

class DataService {
  private out: any

  constructor(out: LoggerContract | Console) {
    this.out = out
  }
  public async syncData(city: string, from: Date, to: Date) {
    const DAY = 1000 * 60 * 60 * 24

    this.out.info(`You are syncing data for ${city} - ${from} -> ${to}...`)

    // Fetch city coordinates from Openweathermap API
    const cityData = await OpenweathermapService.getCityCoords(city)

    if (!cityData) {
      this.out.error('Could not find city.')
      return 1
    }
    const { lat, lon } = cityData
    this.out.info(`Found coordinates for ${city}: ${lat} ${lon}.`)

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

    this.out.success(`Successfully synced data to the database for ${city} - ${from} -> ${to}.`)
  }

  private async fetchAndSavePollutionData(place: Place, from: Date, to: Date): Promise<void> {
    this.out.info(`Fetching batch data for ${from} -> ${to}...`)

    const response = await OpenweathermapService.getPollutionData(place, from, to)

    if (!response) {
      this.out.error('Could not fetch pollution data. Skipping to next one.')
      return
    }

    if (response.list.length === 0) {
      this.out.error(
        'Could not find any pollution data for that time period. Skipping to next one.'
      )
      return
    }

    // create record for each object in res
    let promises: any = []
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
      promises.push(Record.firstOrCreate({ dt: new Date(element.dt), place_id: place!.id }, record))
    }
    try {
      await Promise.all(promises)
    } catch (error) {
      this.out.debug(error.message)
      this.out.error('Could not save record to database. Skipping to next one.')
    }

    /**
     * This is the alternative with fetchOrCreateMany, however, it is slower
     *
     *     // create record for each object in res
     *     const records = response.list.map((element) => {
     *       return {
     *         dt: new Date(element.dt),
     *         place_id: place!.id,
     *         aqi: element.main.aqi,
     *         co: element.components.co,
     *         no: element.components.no,
     *         no_2: element.components.no2,
     *         o_3: element.components.o3,
     *         so_2: element.components.so2,
     *         pm_2_5: element.components.pm2_5,
     *         pm_10: element.components.pm10,
     *         nh_3: element.components.nh3,
     *       } as Partial<Record>
     *     })
     *
     *     try {
     *       await Record.fetchOrCreateMany(['dt', 'place_id'], records)
     *     } catch (error) {
     *       this.out.debug(error.message)
     *       this.out.error('Could not save record to database. Skipping to next one.')
     *     }
     */
  }
  public async deleteData(city: string) {
    this.out.info(`You are deleting data for ${city}...`)

    // Fetch city coordinates from Openweathermap API
    const cityData = await OpenweathermapService.getCityCoords(city)

    if (!cityData) {
      this.out.error('Could not find city.')
      return 1
    }
    const { lat, lon } = cityData

    // Delete all places for the city
    const cityRecords = await Place.query().where('lat', lat).where('lon', lon).delete()
    if (cityRecords[0] === 0) {
      this.out.error('There are no records in the database for this city.')
      return 1
    }

    this.out.success(`Deleted all the records from the database.`)
  }
}

export default DataService
