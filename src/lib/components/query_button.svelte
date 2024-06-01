<script>
    import {getContext} from 'svelte';
    let button_search=getContext('button_search');

    export let query;
    export let include_stories;

    console.log('include_stories',include_stories)

    let window_w;

    function generate_term_html(terms){
        let term_tags=terms.map((term,i)=>`<span class="color${i+1}">${term}</span>`);
        if(term_tags.length>1) term_tags[term_tags.length - 1]='and '+term_tags[term_tags.length - 1];
        return term_tags.join(term_tags.length>2?', ':' ');
    }

    function button_trigger(query){
        button_search(query);
        if(window_w<=900){
            window.scroll({top:0,left:0,behavior:'smooth'})
        }
    }
</script>

<svelte:window bind:innerWidth={window_w}/>

<button on:click={()=>{button_trigger(query)}}  class='graph-input'>Mentions of {@html generate_term_html(query.terms)} by <span class="underline">{query.pub_string}</span> from <span class="underline">{query.clamps.start}</span> to <span class="underline">{query.clamps.end}</span>
    {#if include_stories}&nbsp;<span class="reset-chart">reset chart</span>{/if}
</button>


<style>
    .graph-input{
        text-align:left;
        background-color:white;
        border-radius:5px;
        padding:5px 10px;
        font-family:'Public Sans';
        font-size:16px;
        line-height:24px;
        box-sizing:border-box;
        border:1px solid transparent;
        /* color:black; */
        margin-bottom:12px;
    }

    .reset-chart{
        color:#8A8A8A;
        text-transform:uppercase;
        letter-spacing: 0.06em;
        font-size:12px;
        font-weight:500;
        white-space:nowrap;
        /* display:inline-block; */
        /* display:block; */
        margin-top:10px;
        /* margin-left:10px; */
    }

    @media(hover:hover){
        .graph-input:hover{
            border:1px solid black;
        }

        .graph-input:hover .reset-chart{
            color:black;
        }
    }
</style>