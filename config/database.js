const { Sequelize } = require('sequelize');
require('dotenv').config();



const DB_NAME = 'purecane';
const DB_USER = 'root';
const DB_PASSWORD = '';
const DB_HOST = 'localhost';

// const DB_NAME = 'purecane';
// const DB_USER = 'savan';
// const DB_PASSWORD = 'savan';
// const DB_HOST = '127.0.0.1';

// Set up the Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  dialect: 'mysql',
});



async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('database connected!.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
}

module.exports = { sequelize, testConnection };
