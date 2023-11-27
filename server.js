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
const path = require("path");

const express = require('express');
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
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