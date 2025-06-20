// In src/db/migrations/xxxx_add_documents_to_people_table.js

exports.up = function(knex) {
  return knex.schema.table('people', function(table) {
    // Adiciona colunas para armazenar os caminhos dos arquivos
    table.string('cnh_path');
    table.string('residence_proof_path'); // Comprovante de Residência
    table.string('income_proof_path');    // Comprovante de Renda
  });
};

exports.down = function(knex) {
  return knex.schema.table('people', function(table) {
    // Remove as colunas caso seja necessário reverter a migration
    table.dropColumn('cnh_path');
    table.dropColumn('residence_proof_path');
    table.dropColumn('income_proof_path');
  });
};
