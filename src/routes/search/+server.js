// const Database=require('better-sqlite3');
import Database from 'better-sqlite3';
import { json } from '@sveltejs/kit';

// let db_name='data/all-pubs.db';
// let db_name='data/all-pubs-and-counts.db';
let db_name='data/all-pubs-eav.db';
const db = new Database(db_name, {readonly:true });

export async function POST({ request }) {
    // console.log('req',request)
    let parsed=await request.json();
    console.log('NEW SEARCH ----------------');
    let response=handle_search(parsed);
    return json(response)
}

function handle_search({terms,publications}){
    let response={
        terms:[]
    }
    let t0=Date.now();

    for(let term of terms){
        let n=count_n(term);
        let return_obj={
            gram:term,
            response_type:'success'
        }
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
            let data=db.prepare(query).all();
            
            // in the future add a conditional here, something like
            // if data.length>3, do this
            return_obj.data=data;
            // else change response type to 'insufficient data';

        }else{
            return_obj.response_type='insufficient data';
        }
        response.terms.push(return_obj)
    }

    let t1=Date.now();
    //records performance
    response.time=t1-t0+'ms';

    return response;
}


function count_n(str){
    return str.split(' ').length;
}