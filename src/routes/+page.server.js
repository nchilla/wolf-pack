
import {stories} from '../hooks.server.js';

export async function load(event){
    return {
        stories
    }
    // console.log('=============',stories);
}