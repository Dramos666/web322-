const mongoose = require('mongoose');
let Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
require('dotenv').config();

let userSchema = new Schema({
    userName: {
        type: String,
        unique: true,
    },
    password: String,
    email: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }],
})
let User; // to be defined on new connection (see initialize)

function initialize(){
    return new Promise((resolve, reject)=> {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            reject(err); // reject the promise with the provided error
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });

}

function registerUser(userData) {
    return new Promise((resolve, reject) => {
      // Check if passwords match
      if (userData.password !== userData.password2) {
        reject(new Error("Passwords do not match"));
        return;
      }
  
      // Hash the password before saving to the database
      bcrypt.hash(userData.password, 10)
        .then((hashedPassword) => {
          // Update the userData with the hashed password
          userData.password = hashedPassword;
  
          // Create a new User instance
          const newUser = new User(userData);
  
          // Save the user to the database
          newUser.save()
            .then(() => {
              // User saved successfully
              resolve();
            })
            .catch((err) => {
              reject(new Error(`There was an error creating the user: ${err.message}`));
            });
        })
        .catch((err) => {
          reject(new Error("There was an error encrypting the password"));
        });
    });
  }
function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .exec()
            .then((user) => {
                bcrypt.compare(userData.password, user.password).then((result) => {
                    if (result) {
                        const loginHistoryObj = {dateTime: new Date(), userAgent: userData.userAgent}
                        user.loginHistory.push(loginHistoryObj)
                        // either add the array of loginHistories or add a single one:
                        User.updateOne({ userName: user.userName }, { $set: { loginHistory:  user.loginHistory} })
                        .exec()
                        .then(() => {
                            resolve(user)
                        }).catch((err) => {
                            reject("LOGIN HISTORY UPDATE FAILED")
                        })
                    } else {
                        reject("Credentials incorrect!")
                    }
                }).catch((err) => {
                    reject("Credentials incorrect!")
                })
            }).catch((err) => {
                reject("Credentials incorrect!")
            })
    })
}


module.exports = { initialize,registerUser,checkUser }