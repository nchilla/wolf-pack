//express used to easily configure server responses
const express = require("express");
const bodyParser = require('body-parser')
const app = express();
app.use(bodyParser.json());

const port = 3000;

//package used to read sqlite db in javascript
// https://github.com/WiseLibs/better-sqlite3
const Database=require('better-sqlite3');
const db = new Database('data/all-pubs.db', { verbose: console.log,readonly:true });


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



app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});



function handle_search(query){
    let response={
        terms:[]
    }
    let t0=Date.now();

    // if(query.publications.length>1&&query.publications.findIndex(a=>a.key=='all_publications')) query.publications
    

    


    //loop through all the terms requested
    for(let term of query.terms){
        let n=count_n(term);
        
        let statement=`SELECT * FROM ${query.publications[0].key }_n${n} WHERE gram='${term}'`
        
        if(query.publications.length>1&&query.publications[0].key!=='all_publications'){
            let selects=[];
            for(let pub of query.publications){
                if(!pub[n]){
                    let columns=Object.keys(db.prepare(`SELECT * FROM ${pub.key}_n${n}`).get());
                    let months=[];
                    for(let y=1975;y<2000;y++){
                        for(let m=1;m<13;m++){
                            let str=`m${y}_${m<10?'0':''}${m}`;
                            let match=columns.indexOf(str);
                            if(match>=0) months.push(str);
                            else months.push(`NULL AS ${str}`)
                        }
                    }
                    pub[n]=months;
                }
    
                let select=`
                SELECT gram, ${pub[n].join(', ')}
                FROM ${pub.key}_n${n} WHERE gram='${term}'
                `;
                selects.push(select);
    
            }
            statement=`SELECT gram, ${aggregates.join(', ')}
            FROM (
            ${selects.join('UNION ALL')}
            ) GROUP BY gram;`
        }
        

        //this sets the SQLite statement to search for the term in the database and return it
        let counts=db.prepare(statement).get();
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