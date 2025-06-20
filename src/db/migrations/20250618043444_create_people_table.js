    // src/db/migrations/xxxx_create_people_table.js

    exports.up = function(knex) {
      return knex.schema.createTable('people', function(table) {
        // Chave primária
        table.increments('id').primary();

        // Dados Pessoais
        table.string('name').notNullable();
        table.string('cpf').unique(); // CPF deve ser único
        table.string('rg');
        table.date('birth_date');
        table.string('mother_name');
        table.string('father_name');
        table.string('nationality'); // Naturalidade
        table.string('civil_status'); // Estado Civil
        table.string('gender'); // Sexo
        table.string('email');
        table.string('phone'); // Telefone Fixo
        table.string('cell_phone'); // Celular
        
        // Endereço
        table.string('address');
        table.string('address_number');
        table.string('address_complement');
        table.string('zip_code'); // CEP
        table.string('neighborhood'); // Bairro
        table.string('city');
        table.string('state');
        table.string('residence_time');

        // Dados Profissionais
        table.string('company_name');
        table.string('company_cnpj');
        table.string('position'); // Cargo
        table.decimal('income', 10, 2); // Renda
        table.string('company_address');
        table.string('company_phone');
        table.string('employment_time');

        // Referências Bancárias
        table.string('bank_name');
        table.string('bank_agency');
        table.string('bank_account');
        table.string('bank_account_time');

        // Referências Pessoais (armazenadas como JSON para simplicidade)
        table.json('personal_references');

        // Informações Adicionais
        table.text('additional_info');
        
        // Timestamps
        table.timestamps(true, true);
      });
    };

    exports.down = function(knex) {
      return knex.schema.dropTable('people');
    };
    