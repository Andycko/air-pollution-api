import axios, { AxiosInstance } from 'axios'

export interface Coordinates {
  lat: number
  lon: number
}

class OpenweathermapService {
  private apiInstance: AxiosInstance
  constructor() {
    this.apiInstance = axios.create({
      baseURL: 'http://api.openweathermap.org/',
    })
  }
  public async getCityCoords(cityName: string) {
    const res = await this.apiInstance.get('geo/1.0/direct', {
      params: {
        q: cityName,
        limit: 1,
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
    })

    if (!res.data || res.data.length === 0) return null

    return { lat: res.data[0].lat, lon: res.data[0].lon } as Coordinates
  }
  public async getCityName(location: Coordinates) {
    const res = await this.apiInstance.get('geo/1.0/reverse', {
      params: {
        lat: location.lat,
        lon: location.lon,
        limit: 1,
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
    })

    if (!res.data || res.data.length === 0) return null

    return res.data[0].name
  }
  public async getPollutionData(location: Coordinates, from: Date, to: Date) {
    const res = await this.apiInstance.get('data/2.5/air_pollution/history', {
      params: {
        lat: location.lat,
        lon: location.lon,
        start: from.getTime(),
        end: to.getTime(),
        appid: process.env.OPENWEATHERMAP_API_KEY,
      },
    })

    if (!res.data) return null
    return res.data
  }
}

export default new OpenweathermapService()
