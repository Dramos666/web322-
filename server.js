/********************************************************************************
* WEB322 – Assignment 05
* 
* I declare that this assignment is my own work in accordance with Seneca's
* Academic Integrity Policy:
* 
* https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
* Name: Subin Sunny  Student ID: 167908219 Date: 27/11/2023
*
*Published URL : https://frail-raincoat-goat.cyclic.app
*
********************************************************************************/

const legoData = require("./modules/legoSets");
const authData = require("./modules/auth-service");
const clientSessions = require("client-sessions");
const path = require("path");

const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');



app.use(
  clientSessions({
    cookieName: 'session', // this is the object name that will be added to 'req'
    secret: 'o6LjQ5EVNC28ZgK64hDELM18ScpFQr', // this should be a long un-guessable string.
    duration: 10 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 600, // the session will be extended by this many ms each request (1 minute)
  })
);
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});


function ensureLogin(req, res, next) {
  if (!req.session.user) {
    res.redirect('/login');
  } else {
    next();
  }
}

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

// GET route to render the login view
app.get('/login', (req, res) => {
  res.render('login', { errorMessage: '', userName: '' }); // Adjust the view name accordingly
});

// GET route to render the register view
app.get('/register', (req, res) => {
  res.render('register', { successMessage:'', errorMessage: '', userName: '' }); // Adjust the view name accordingly
});

// POST route for user registration
app.post('/register', (req, res) => {
  authData.registerUser(req.body)
      .then(() => res.render('register', { successMessage: 'User created', errorMessage: '', userName: '' }))
      .catch((err) => res.render('register', { successMessage:'', errorMessage: err, userName: req.body.userName }));
});

// POST route for user login
app.post('/login', (req, res) => {
  req.body.userAgent = req.get('User-Agent');

  authData.checkUser(req.body)
      .then((user) => {
          req.session.user = {
              userName: user.userName,
              email: user.email,
              loginHistory: user.loginHistory
          };
          res.redirect('/lego/sets');
      })
      .catch((err) => res.render('login', { errorMessage: err, userName: req.body.userName }));
});

// GET route for user logout
app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

// GET route to render the userHistory view
app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory'); // Adjust the view name accordingly
});

app.get("/lego/sets", async (req,res)=>{

  let sets = [];

  try{    
    if(req.query.theme){
      sets = await legoData.getSetsByTheme(req.query.theme);
    }else{
      sets = await legoData.getAllSets();
    }

    res.render("sets", {sets})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
  
});

app.get("/lego/sets/:num", async (req,res)=>{
  try{
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", {set})
  }catch(err){
    res.status(404).render("404", {message: err});
  }
});



app.get('/lego/addSet', (req, res) => {
  legoData.getAllThemes()
      .then((themes) => {
          res.render('addSet', { themes: themes });
      })
      .catch((err) => {
          res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
      });
});

app.post('/lego/addSet', (req, res) => {
  const setData = req.body;

  legoData.addSet(setData)
      .then(() => {
          res.redirect('/lego/sets');
      })
      .catch((err) => {
          res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
      });
});

app.get('/lego/editSet/:num', async (req, res) => {
  try {
    // const setNum = req.params.num;
    let setData = await legoData.getSetByNum(req.params.num);
    let themeData = await legoData.getAllThemes();

    res.render("editSet", { "themes": themeData, "set": setData });
  } catch (err) {
    res.status(404).render('404', { message: err });
  }
});


app.post('/lego/editSet', async (req, res) => {
  try {
    const setNum = req.body.set_num;
    const setData = req.body;

    await legoData.editSet(setNum, setData);

    res.redirect('/lego/sets');
  } catch (err) {
    res.render('500', { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/deleteSet/:num", (req, res) => {
  legoData.deleteSet(req.params.num).then(() => {
    res.redirect("/lego/sets");
  })
  .catch((err) => {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  });
});


app.use((req, res, next) => {
  res.status(404).render("404", {message: "I'm sorry, we're unable to find what you're looking for"});
});

legoData.initialize().then(()=>{
  app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
});