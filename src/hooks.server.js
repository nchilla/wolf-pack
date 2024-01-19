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

    stories.push({
        n,
        text,
        title,
        id:'story'+n
    })

}


export {stories};


