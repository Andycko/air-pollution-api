import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Records extends BaseSchema {
  protected tableName = 'records'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('dt').notNullable()
      table.integer('place_id').notNullable()
      table.unique(['place_id', 'dt'])
      table.integer('aqi').notNullable()
      table.float('co').notNullable()
      table.float('no').notNullable()
      table.float('no_2').notNullable()
      table.float('o_3').notNullable()
      table.float('so_2').notNullable()
      table.float('pm_2_5').notNullable()
      table.float('pm_10').notNullable()
      table.float('nh_3').notNullable()
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('place_id').references('places.id').onDelete('CASCADE')
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
