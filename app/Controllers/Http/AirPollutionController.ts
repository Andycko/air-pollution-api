import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Place from 'App/Models/Place'
import Record from 'App/Models/Record'
import axios from 'axios'
import OpenweathermapService from 'App/Services/OpenweathermapService'

export default class AirPolutionController {
  public async avg({ request, response }: HttpContextContract) {
    let { city, from, to } = request.qs()
    if (!city || !from || !to)
      return response.status(422).json({
        error: 'Missing required query variables',
        missingVariables: {
          city: !city,
          from: !from,
          to: !to,
        },
      })

    from = new Date(from)
    to = new Date(to)

    // Fetch city coordinates from Openweathermap API
    const cityData = await OpenweathermapService.getCityCoords(city)

    if (!cityData)
      return response.status(404).json({
        error: 'Could not find city coordinates.',
      })

    const { lat, lon } = cityData

    // Check if city exists in database
    const place = await Place.query().where({ lat, lon }).first()

    if (!place)
      return response.status(404).json({
        error: `Could not find ${city} in the database.`,
      })

    // get all the data for city between from and to
    const pollutionData = await Record.query()
      .where('place_id', place.id)
      .whereBetween('dt', [from, to])
      .avg({
        aqi: 'aqi',
        co: 'co',
        no: 'no',
        no_2: 'no_2',
        o_3: 'o_3',
        so_2: 'so_2',
        pm_2_5: 'pm_2_5',
        pm_10: 'pm_10',
        nh_3: 'nh_3',
      })
      .first()

    if (!pollutionData)
      return response.status(404).json({
        error: `Could not find data for ${city} between ${from} and ${to}.`,
      })

    // return the average values
    return pollutionData
  }

  public async cityMax({ request, response }: HttpContextContract) {
    let { from, to } = request.qs()
    if (!from || !to)
      response.status(422).json({
        error: 'Missing required query variables',
        missingVariables: {
          from: !from,
          to: !to,
        },
      })

    from = new Date(from)
    to = new Date(to)

    // get all the records data between from and to
    const pollutionData = await Record.query()
      .whereBetween('dt', [from, to])
      .join('places', 'records.place_id', '=', 'places.id')
      .select('places.lat')
      .select('places.lon')
      .groupBy('places.id')
      .avg({
        aqi: 'aqi',
        co: 'co',
        no: 'no',
        no_2: 'no_2',
        o_3: 'o_3',
        so_2: 'so_2',
        pm_2_5: 'pm_2_5',
        pm_10: 'pm_10',
        nh_3: 'nh_3',
      })
      .orderBy('aqi', 'desc')
      .first()

    if (!pollutionData)
      return response.status(404).json({
        error: `Could not find data between ${from} and ${to}.`,
      })

    const cityName = await OpenweathermapService.getCityName({
      lat: pollutionData.lat,
      lon: pollutionData.lon,
    })

    if (!cityName)
      return response.status(500).json({
        error: 'Server Error. Could not find city name.',
      })

    delete pollutionData.lat
    delete pollutionData.lon

    return {
      city: cityName,
      pollutionData: pollutionData,
    }
  }
}
