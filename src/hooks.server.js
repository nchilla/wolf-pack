import * as fs from 'fs';
import * as marked from 'marked';

let about={
    title:'About',
    ...parse_content('about')
};
let credits={
    title:'Credits',
    ...parse_content('credits')
};
let howtouse={
    title:'How to use this database',
    ...parse_content('howtouse')
};
let howtointerpret={
    title:'How to interpret the graph',
    ...parse_content('howtointerpret')
};

let story_count=3;

let stories=[];

console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++\n');
for(let n=1;n<=story_count;n++){
    let parsed=parse_content(`story${n}`,n)
    stories.push(parsed)

}

function parse_content(filename,n){
    let text=[];
    let str=fs.readFileSync(`content/${filename}.md`, 'utf8');
    text=marked.parse(str).split('\n');
    let data_button_i=text.findIndex(a=>a.startsWith('<p><code>'))
    if(data_button_i>=0) text[data_button_i]=JSON.parse(text[data_button_i].match(/(?<=<p><code>)(.*)(?=<\/code><\/p>)/g)[0].replaceAll('&quot;',`"`));

    let parsed={
        text,
        id:filename
    }
    if(n) parsed.n=n;

    return parsed;
}



export {stories,about,credits,howtouse,howtointerpret};


