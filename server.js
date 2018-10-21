var express = require("express");
var exphbs = require("express-handlebars");
var mongoose = require("mongoose");
var db = require("./models");
var cheerio = require("cheerio");
var path = require('path');
// var axios = require("axios");

//Promise for https.request using require('https')
var https = require("https");
const getRequest = function(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if(response.statusCode >= 200 && response.statusCode < 300) {
        let data = '';
        response.on('data', (chunk) => data += chunk );

        response.on('end', () => resolve(data) );
      } else {
        reject(new Error(response.statusCode));
      }
    });
    request.on('error', (err) => reject(err))
  })
}

// Initialize Express
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
app.use(express.static(path.join(__dirname + '/public')));
//Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

app.get("/", function(req, res) {
  res.render("index");
});

app.get("/scrape", function(req, res) {
  getRequest('https://www.brainyquote.com/topics/daily')
  .then((response) => {
    // res.send(response.data);
    let $ = cheerio.load(response);
    $('a.b-qt').each(function(i, element) {
      let result = {};
      result.quote = $(this).text();
      result.author = $(this).parent().find("a.bq-aut").text();
      db.Quote.create(result);
    });
    res.send("Scrape Complete!");
  })
  .catch((err) => res.send("The Error:" + err));
});

app.get("/quotes", (req, res) => {
  db.Quote.find({}).then(function(quotes) {
    res.render("quotes", {
      one: quotes[0],
      two: quotes[1],
      three: quotes[2],
      four: quotes[3],
      five: quotes[4]
    });
  });
});

app.get("/allquotes", (req, res) => {
  db.Quote.find({}).then(function(quotes) {
    res.json(quotes);
  });
});

app.listen(process.env.PORT, function() {
  console.log("App running on port:", process.env.PORT);
});
