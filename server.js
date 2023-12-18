//express used to easily configure server responses
const express = require("express");
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json());

const port = 3000;

//package used to read sqlite db in javascript
// https://github.com/WiseLibs/better-sqlite3
const Database=require('better-sqlite3');

// let db_name='data/all-pubs.db';
// let db_name='data/all-pubs-and-counts.db';
let db_name='data/all-pubs-eav.db';


const db = new Database(db_name, {readonly:true });


let aggregates=[];

for(let y=1975;y<2000;y++){
    for(let m=1;m<13;m++){
        let str=`m${y}_${m<10?'0':''}${m}`;
        aggregates.push(`SUM(${str}) AS ${str}`);
    }
}


//root directory
let dir=__dirname;

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


function handle_search({terms,publications}){
    let response={
        terms:[]
    }
    let t0=Date.now();

    for(let term of terms){
        let n=count_n(term);
        // still have to figure out what happens/happened to quotations in terms
        let gram_id=db.prepare(`SELECT id FROM _grams_n${n} WHERE gram = '${term}';`).get()?.id;
        if(gram_id){
            let start_string=`SELECT month, (CAST(SUM(counts.count) AS FLOAT) / CAST( SUM(_totals_n${n}.count) AS FLOAT)) AS val FROM `;
            let selects=[];
            let conditionals=[];
            for(let pub of publications){
                selects.push(`SELECT * FROM ${pub.key}_n${n} WHERE gram_id=${gram_id} AND month>='1975-01' AND month<='2000-12'`);
                conditionals.push(`_totals_n${n}.pub_id = ${pub.id}`);
            }
            let select_string = ` (\n` + selects.join(`\nUNION ALL\n`)  + `\n) AS COUNTS`;
            let totals_join_string = `\nLEFT JOIN _totals_n${n} USING(month) WHERE (\n` + conditionals.join(`\n OR `) + `\n)`;
            let query=start_string + select_string + totals_join_string + `\n GROUP BY month ORDER BY month;`
            console.log(query);
            let data_return=db.prepare(query).all();
            console.log(data_return);
        }
    }

    let t1=Date.now();
    //records performance
    response.time=t1-t0+'ms';

    return response;
}


app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});





function count_n(str){
    return str.split(' ').length;
}