
import {stories,about,credits} from '../hooks.server.js';

export async function load(event){
    return {
        stories,
        about,
        credits
    }
    // console.log('=============',stories);
}