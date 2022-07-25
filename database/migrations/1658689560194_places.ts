import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Places extends BaseSchema {
  protected tableName = 'places'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.float('lat').notNullable()
      table.float('lon').notNullable()
      table.unique(['lat', 'lon'])
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
