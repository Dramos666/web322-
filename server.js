/********************************************************************************
* WEB322 – Assignment 06
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Subin Sunny  Student ID: 167908219 Date: 13/12/2023
*
*Published URL : https://frail-raincoat-goat.cyclic.app
*
********************************************************************************/

const authData = require("./modules/auth-service")
const legoData = require("./modules/legoSets");
const clientSessions = require('client-sessions');
const express = require('express');
const path = require("path");
const app=express();
const HTTP_PORT = process.env.PORT || 8080; 
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.errorMessage = null
  res.locals.successMessage = null
  res.locals.userName=''
  next();
});
function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}
legoData.initialize()
.then(authData.initialize)
.then(()=>{
  app.listen(HTTP_PORT, () => console.log(`server listening on: ${HTTP_PORT}`));
})
app.get("/",(req, res)=> {
  res.render("home");
});
app.get("/about", function (req, res) {
  res.render("about");
});
app.get("/404", function (req, res) {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});
  app.get('/lego/sets', (req, res) => {
    const theme=req.query.theme;
    if(theme){
      legoData.getSetsByTheme(theme).then((data)=>{
        if(data.length===0){
          res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
        }else{
          res.render("sets",{
            data: data
          })
        }
    }).catch((error)=>{
      res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
    })
    }else{
      legoData.getAllSets().then((data)=>{
        res.render("sets",{
          data: data
        })
      }).catch((error)=>{
        res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
      })   
    }
  });
  app.get('/lego/sets/:setNum', (req, res) => {
    const setNum = req.params.setNum;
    legoData.getSetByNum(setNum)
        .then((data) => {
            if (data) {
                res.render("set",{
                  set: data
                });
            } else {
              res.render("404")
            }
        })
        .catch((error) => {
          res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
        });
});
app.get('/lego/addSet', ensureLogin,(req, res) => {
  legoData .getAllThemes()
    .then((themeData) => {
      res.render("addSet", { themes: themeData });
    })
    .catch((error) => {
      res.send('Internal Server Error in addSet');
    });
});
app.post('/lego/addSet', ensureLogin,(req, res) => {
  legoData.addSet(req.body)
    .then(() => {
      res.redirect('/lego/sets');
    })
    .catch((error) => {
      res.render('500', { message: `I'm sorry, but we have encountered the following error: ${error.message}` });
    });
  })
  app.get('/lego/editSet/:num',ensureLogin,(req,res)=>{
    const num=req.params.num
    Promise.all([
      legoData.getSetByNum(num),
      legoData.getAllThemes(),
    ])
      .then(([set, themes]) => {
        res.render('editSet', { themes: themes, set: set });
      })
      .catch((error) => {
        res.status(404).render('404', { message: error.message });
      });
  })
  app.post('/lego/editSet',ensureLogin,(req,res)=>{ 
  legoData.editSet(req.body.set_num,req.body)
    .then(() => {
      res.redirect('/lego/sets');
    })
    .catch((error) => {
      res.render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` });
    });
  })

  app.get('/lego/deleteSet/:num',ensureLogin, (req, res) => {
    legoData.deleteSet(req.params.num)
      .then(() => {
        res.redirect('/lego/sets');
      })
      .catch((error) => {
        res.render('500', { message: `I'm sorry, but we have encountered the following error: ${error}` });
      });
  });

  app.get("/login", (req, res) => {
    res.render("login")
  })
  app.get("/register", (req, res) => {
    res.render("register");
  });
  
  app.post("/register", (req, res) => {
    console.log(req.body)
    authData.registerUser(req.body)
      .then(() => {
        res.render('register', {
          successMessage: "User created"
        });
      })
      .catch((err) => {
        res.render('register', {
          errorMessage: err,
          userName: req.body.userName
        });
      });
  });
  
  
  

  app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent")
    authData.checkUser(req.body).then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory
      }
  
      res.redirect("/lego/sets")
    }).catch((err) => {
      res.render("login", {
        errorMessage: err,
        userName: req.body.userName
      })
    })
  })
 app.get("/logout",(req,res)=>{
  req.session.reset();
  res.redirect("/");
 })

 app.get("/userHistory",ensureLogin,(req,res)=>{
  res.render("userHistory");
 })