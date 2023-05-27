const Database=require('better-sqlite3');
const db = new Database('data/new-york-times.db', {readonly:true });


let months=[];

for(let y=1980; y<=1999;y++){
    let start=y==1980?6:1;
    for(let m=start; m<=12;m++){
        let d=`IFNULL( m${y}_${m<10?0:''}${m} , 0)`;
        months.push(d)
    }
}

let sum=months.join(' + ')
// this variable looks like this:
// IFNULL(m1980_06,0) + IFNULL(m1980_07,0) + IFNULL(m1980_08,0) + ...

// sum used to add together all the month columns in the below query
// IFNULL picks the first not-null value, so if a cell is empty it counts it as zero

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//  SQL query:
// `SELECT COUNT(*) AS count FROM [table] WHERE (${sum}) < 2`
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// how the query works:
// COUNT(*) counts all the rows that pass the condition set in WHERE
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

// counting and generating percentage for each n value --------------------------------------

let count_n1_all=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n1`).get();
let count_n1_below_2=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n1 WHERE (${sum}) < 2`).get();

console.log('n1 below 2 occurrences:',Math.round(count_n1_below_2.count/count_n1_all.count*100)+'%');

let count_n2_all=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n2`).get();
let count_n2_below_2=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n2 WHERE (${sum}) < 2`).get();

console.log('n2 below 2 occurrences:',Math.round(count_n2_below_2.count/count_n2_all.count*100)+'%');

let count_n3_all=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n3`).get();
let count_n3_below_2=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n3 WHERE (${sum}) < 2`).get();

console.log('n3 below 2 occurrences:',Math.round(count_n3_below_2.count/count_n3_all.count*100)+'%');

let count_n4_all=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n4`).get();
let count_n4_below_2=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n4 WHERE (${sum}) < 2`).get();

console.log('n4 below 2 occurrences:',Math.round(count_n4_below_2.count/count_n4_all.count*100)+'%');

let count_n5_all=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n5`).get();
let count_n5_below_2=db.prepare(`SELECT COUNT(*) AS count FROM new_york_times_n5 WHERE (${sum}) < 2`).get();

console.log('n5 below 2 occurrences:',Math.round(count_n5_below_2.count/count_n5_all.count*100)+'%');
