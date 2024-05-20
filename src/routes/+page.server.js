
import {stories,about,credits,howtouse,howtointerpret} from '../hooks.server.js';

export async function load(event){
    return {
        stories,
        about,
        credits,
        home_sections:{howtouse,
        howtointerpret},
        include_stories:false
    }
    // console.log('=============',stories);
}