// knexfile.js
module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3' // Nome do arquivo do nosso banco de dados
    },
    useNullAsDefault: true, // Configuração padrão para sqlite
    migrations: {
      directory: './src/db/migrations' // Onde salvaremos as "versões" do nosso banco
    }
  }
};