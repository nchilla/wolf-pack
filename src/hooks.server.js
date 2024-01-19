import * as fs from 'fs';
import * as marked from 'marked';


let story_count=2;

let stories=[];

console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++\n');
for(let n=1;n<=story_count;n++){
    let text=[]
    let str=fs.readFileSync(`content/story${n}.md`, 'utf8');
    
    text=marked.parse(str).split('\n');
    let title=text[0].match(/(?<=<h3>)(.*)(?=<\/h3>)/g)[0];
    console.log(text);

    let data_button_i=text.findIndex(a=>a.startsWith('<p><code>'))
    if(data_button_i>=0) text[data_button_i]=JSON.parse(text[data_button_i].match(/(?<=<p><code>)(.*)(?=<\/code><\/p>)/g)[0].replaceAll('&quot;',`"`))

    stories.push({
        n,
        text,
        title,
        id:'story'+n
    })

}


export {stories};


