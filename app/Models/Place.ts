import { BaseModel, column } from '@ioc:Adonis/Lucid/Orm'

export default class Place extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public lat: number

  @column()
  public lon: number
}
