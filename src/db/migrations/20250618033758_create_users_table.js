// Dentro do novo arquivo na pasta src/db/migrations/

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary(); // Chave primária autoincrementável (ex: 1, 2, 3...)
    table.string('name').notNullable();
    table.string('role').notNullable();
    table.string('password_hash').notNullable(); // NUNCA salve senhas como texto puro
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};