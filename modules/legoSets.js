require('dotenv').config();
const Sequelize = require('sequelize');
const setData = require("../data/setData");
const themeData = require("../data/themeData");
let sets = [];


// set up sequelize to point to our postgres database
const sequelize = new Sequelize('A5', 'subinsunny2382', 'gHKfyoxN7Z0X', {
  host: 'ep-lingering-pond-74987303.us-east-2.aws.neon.tech',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
});

const Theme = sequelize.define('Theme', {
  id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
  },
  name: Sequelize.STRING,
},
{
  createdAt: false, // disable createdAt
  updatedAt: false, // disable updatedAt
});

const Set = sequelize.define('Set', {
  
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  year: Sequelize.INTEGER,
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
    },
  name: Sequelize.STRING,
  img_url: Sequelize.STRING,
},
{
  createdAt: false, // disable createdAt
  updatedAt: false, // disable updatedAt
});


sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });


function initialize() {
  return new Promise((resolve, reject) => {
    sequelize.sync().then(() => {
      resolve('operation was a success');
    }).catch(() => {
      reject("unable to sync the database");
    });
    
  });

}

function getAllSets() {
  return Set.findAll({ include: [Theme] });

}

function getSetByNum(setNum) {
  return Set.findAll({
      where: { set_num: setNum },
      include: [Theme],
  }).then((sets) => {
      if (sets.length > 0) {
          return sets[0];
      } else {
          throw new Error('Unable to find requested set');
      }
  });
}


function getSetsByTheme(theme) {
  return Set.findAll({
      include: [Theme],
      where: {
          '$Theme.name$': {
              [Sequelize.Op.iLike]: `%${theme}%`,
          },
      },
  }).then((sets) => {
      if (sets.length > 0) {
          return sets;
      } else {
          throw new Error('Unable to find requested sets');
      }
  });
}

function addSet(setData){
  return new Promise((resolve, reject) => {
      Set.create(setData)
          .then(() => resolve())
          .catch((err) => reject(err.errors[0].message));
  });
};

function getAllThemes(){
  return new Promise((resolve, reject) => {
      Theme.findAll()
          .then((themes) => resolve(themes))
          .catch((err) => reject(err));
  });
};

function editSet(set_num, setData){
  return new Promise((resolve, reject) => {
    Set.update(setData, { where: { set_num } })
      .then((result) => {
        if (result[0] === 0) {
          reject({ message: "Can not find the set" });
        } else {
          resolve();
        }
      })
      .catch((err) => {
        reject({ message: err.errors[0].message });
      });
  });
};

function deleteSet(set_num){
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: set_num
      }
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.errors[0].message);
      });
  });
};

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet }

