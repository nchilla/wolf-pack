import * as fs from 'fs';
import * as marked from 'marked';

let about=[parse_content('about')];
let credits=[parse_content('credits')];
// let credits_str=fs.readFileSync(`content/credits.md`, 'utf8');

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
    let title=text[0].match(/(?<=<h3>)(.*)(?=<\/h3>)/g) || [] [0];
    let data_button_i=text.findIndex(a=>a.startsWith('<p><code>'))
    if(data_button_i>=0) text[data_button_i]=JSON.parse(text[data_button_i].match(/(?<=<p><code>)(.*)(?=<\/code><\/p>)/g)[0].replaceAll('&quot;',`"`));

    let parsed={
        text,
        title,
        id:filename
    }
    if(n) parsed.n=n;

    return parsed;
}



export {stories,about,credits};


