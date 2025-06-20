// in src/db/migrations/20250619230939_create_messages_table.js

exports.up = function(knex) {
  return knex.schema.createTable('messages', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email');
    table.string('phone');
    table.string('origin').notNullable();
    table.text('message');
    table.json('details');
    table.boolean('read').defaultTo(false);
    table.timestamps(true, true);
  });
};

// AQUI ESTÁ A CORREÇÃO:
// Usamos 'dropTableIfExists' em vez de 'dropTable'.
// Isto garante que o comando não falha se a tabela não existir.
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('messages');
};