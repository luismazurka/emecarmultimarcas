// in src/db/migrations/xxxx_create_vehicles_table.js

exports.up = function(knex) {
  return knex.schema.createTable('vehicles', function(table) {
    table.increments('id').primary();

    // Informações Básicas
    table.string('tipo'); // Carro, Moto, etc.
    table.string('marca').notNullable();
    table.string('modelo').notNullable();
    table.string('versao');
    table.string('cambio');
    table.integer('ano_fab');
    table.integer('ano_modelo');
    table.string('cor');
    table.string('combustivel');
    table.string('placa').unique();
    table.integer('km');

    // Opcionais (armazenados como JSON)
    table.json('opcionais');

    // Descrição e Anotações
    table.text('descricao');
    table.text('anotacoes');

    // Fotos (armazenadas como JSON de caminhos de ficheiro)
    table.json('fotos_paths');

    // Valores
    table.decimal('valor_fipe', 10, 2);
    table.decimal('valor_compra', 10, 2);
    table.decimal('valor_venda', 10, 2);
    table.decimal('margem', 10, 2);

    // Origem e Disponibilidade
    table.string('origem'); // proprio, consignado
    table.string('loja_origem');
    table.string('proprietario_nome');
    // Adicionamos uma chave estrangeira para ligar ao proprietário (pessoa)
    table.integer('person_id').unsigned().references('id').inTable('people').onDelete('SET NULL');
    table.string('disponivel_em');

    // Visibilidade no Site
    table.boolean('exibir_site').defaultTo(false);
    table.boolean('destaque_site').defaultTo(false);
    
    // Status para o Painel Kanban (MUITO IMPORTANTE PARA O FUTURO)
    table.string('status').defaultTo('preparacao'); // Ex: preparacao, estoque, vendido

    // Timestamps
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('vehicles');
};
