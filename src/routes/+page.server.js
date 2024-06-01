
import {stories,about,howtouse,howtointerpret} from '../hooks.server.js';

export async function load(event){
    return {
        stories,
        home_sections:[
            howtouse,
            howtointerpret,
            about
        ],
        include_stories:false
    }
    // console.log('=============',stories);
}