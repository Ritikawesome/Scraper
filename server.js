var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
//Scraping tools:
var cheerio = require("cheerio");
var request = require("request");
var exhbs = require("express-handlebars");
//Initialize Express
var app = express();

// Connects to the Mongo DB
var db = mongoose.connection;
mongoose.connect("mongodb://localhost/scraper", { useNewUrlParser: true });
// mongoose.connect("");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
    extended: false
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

//Show error or success
db.on("error", function(err){
    console.log("Mongoose error: " + err);
})
db.once("open", function(){
    console.log("Mongoose is successful");
});

//Modals
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

//Routes
app.get("/", function(req, res){
    res.send(index.html);
});
// A GET request to scrape the abcnews website
app.get("/scraper", function(req, res){
    request("https://abcnews.go.com/", function(error, response, html){
        var $ = cheerio.load(html);
        $("h1").each(function(i, element){
            var result = {};
            //adds text and saves
            result.title = $(this).children("a").text();
            result.link = $(this).children("a").attr("href");
            //creates a new entry
            var entry = new Article(result);
            entry.save(function(err, doc){
                if(err){
                    console.log(err);
                }
                else {
                    console.log(doc);
                }
            });
        });
    });
    res.send("The scrape is complete");
});

//A GET route to get the scraped articles
/*
app.get('/scraper', function(req, res){
    Article.find({}, function(err, doc){
        if(err){
            console.log(err);
        } 
        else { 
            res.json(doc); 
        }
    });
});*/


//A GET route to get the scraped articles
app.get('/Article', function(req, res){
    Article.find({}, function(err, doc){
        if(err){
            console.log(err);
        } 
        else { 
            res.json(doc); 
        }
    });
});

// A GET route for grabbing the scraped articles
app.get("/Article/:id", function(req, res){
    //app.get("/Article", function(req, res){
    Article.findOne({"_id": req.params.id})
    .populate("note")
    .exec(function(err, doc){
        if(err){
            console.log(err);
        }
        else {
            res.json(doc);
        }
    });
}); 

//A POST route to replace the existing note with a new one
app.post('/Article/:id', function(req, res){
    var newNote = new Note(req.body);

    newNote.save(function(err, doc){
        if (err) {
            console.log(err);
        } else {
            Article.findOneAndUpdate({'_id': req.params.id}, {'note': doc._id})
            .exec(function(err, doc){
                if(err){
                    console.log(err);
                } 
                else { 
                    res.send(doc); 
                }
            });
        }
    });
});

//Start the server; port listening
app.listen(process.env.PORT || 3333, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
