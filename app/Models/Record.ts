import { BaseModel, column, HasOne, hasOne } from '@ioc:Adonis/Lucid/Orm'
import Place from './Place'

export default class Record extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public dt: Date

  @hasOne(() => Place, {
    foreignKey: 'id',
  })
  public place: HasOne<typeof Place>

  @column()
  public place_id: number

  @column()
  public aqi: number

  @column()
  public co: number

  @column()
  public no: number

  @column()
  public no_2: number

  @column()
  public o_3: number

  @column()
  public so_2: number

  @column()
  public pm_2_5: number

  @column()
  public pm_10: number

  @column()
  public nh_3: number

}
