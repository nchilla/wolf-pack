
import {stories,about,credits} from '../hooks.server.js';

export async function load(event){
    return {
        stories,
        about,
        credits,
        include_stories:false
    }
    // console.log('=============',stories);
}