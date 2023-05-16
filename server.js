//express used to easily configure server responses
const express = require("express");
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json());

const port = 3000;

//package used to read sqlite db in javascript
// https://github.com/WiseLibs/better-sqlite3
const Database=require('better-sqlite3');
const db = new Database('data/new-york-times.db', { verbose: console.log,readonly:true });

//root directory
let dir='/Users/hubblebot/Documents/dev-offline/wolf-pack-server';

//serve static assets (e.g. css, js) from static folder
app.use(express.static("static"));

//sends the html for the page when a request arrives for the root director (localhost:3000/)
app.get("/", function (req, res) {
    res.sendFile(dir + "/_site/index.html");
});

//receives a search query from the page, searches the database, and returns the result
app.post("/search", function (req, res) {
    // todo: properly validate this request
    console.log('received',req.body)
    
    new Promise((resolve) => {
        let response=handle_search(req.body);
        res.send(response);
        console.log('generated response in',response.time);
        resolve();

      });
});



app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});



function handle_search(query){
    let response={
        terms:[]
    }
    let t0=Date.now();

    //loop through all the terms requested
    for(let term of query.terms){
        let n=count_n(term);

        //this sets the SQLite statement to search for the term in the database and return it
        let counts=db.prepare(`SELECT * FROM new_york_times_n${n} WHERE gram='${term}'`).get();
        response.terms.push(counts);
    }
    let t1=Date.now();
    //records performance
    response.time=t1-t0+'ms';

    return response;
}

function count_n(str){
    return str.split(' ').length;
}