<script>
    import {getContext} from 'svelte';
    export let pub_search_term;
    export let terms;
    export let visible_terms;
    export let term_focused = undefined;
    export let clamps;
    export let minmax;
    export let publications;
    export let summary_string;
    export let doc;
   
    $: checked_pubs=publications.filter(a=>a.checked);

    let term_timer;

    let search=getContext('search');
    let refresh_svelte_array=getContext('refresh_svelte_array');

    function toggle_focus(i,val){
        console.log('toggle')
        term_focused=val?i:undefined;
        
        if((!val)&&visible_terms.length>1&&terms[0].gram.length<1){
            terms.forEach((term,t)=>{
                if(t>0) terms[t-1].gram=term.gram;
            })
        }
    }

    function is_invalid(v,which){
        return v<minmax[which][0]||v>minmax[which][1];
    }

    function handle_year_event(which,event_type){
        let v=clamps[which];
        if(event_type=='input'){
            if(!is_invalid(v,which)){
                if(which=='start') minmax.end[0]=v+2;
                else minmax.start[1]=v-2;
            }
        }else if(event_type=='change'){
            let node=doc.querySelector(`.year-wrapper input[data-clamp="${which}"]`)
            if(is_invalid(v,which)){
                clamps[which]=node.dataset.old;
            }else{
                node.dataset.old=v;
            }

            
        }
        
        
    }

    function add_term(){
        console.log(visible_terms.length,terms[visible_terms.length])
        term_focused=visible_terms.length;
    }

    function term_input(term){
        clearTimeout(term_timer);
        term_timer=setTimeout(function(){
            // if(term.node) term.node.dataset.old=term.gram;
            if(term.gram.length>0){
                console.log('!!! term update !!!')
                search();
            }else{
                term.plot=[];
                graph.update();
            }
            // console.log('!!! term update !!!')
            // search();
            
        },1000)
    }
</script>


<nav id="search">
    Mentions of
    <span class="search-terms" data-count={visible_terms.length}>
        {#each terms as term}
            {#if term.visible}
                <span class="wrapper-wrapper">
                    <span class="gram-search-wrapper">
                        <span class="width-setter">{term.gram}</span>
                        <input
                            type="text"
                            class="gram-search"
                            on:focus={() => toggle_focus(term.i, true)}
                            on:focusout={() => toggle_focus(term.i, false)}
                            on:input={() => term_input(term)}
                            bind:value={term.gram}
                            bind:this={term.node}
                            data-old=""
                            style="--rgb: {term.color}"
                        />
                    </span>
                </span>
            {/if}
        {/each}
        <button
            class="add-more"
            class:hide={visible_terms.length > 4}
            on:click={add_term}>+</button
        >
    </span>
    in crime reporting by

    <span id="publication-dropdown">
        <details class="noselect">
            <summary>{summary_string}</summary>
            <ul>
                <div class="publication-search">
                    <input
                        type="text"
                        placeholder="search"
                        bind:value={pub_search_term}
                    />
                </div>
                {#each publications as pub}
                    <li
                        class:selected={pub.checked}
                        class:hide={!pub.search_match && !pub.checked}
                        class:only-check={checked_pubs.length == 1 &&
                            pub.checked}
                    >
                        <input
                            type="checkbox"
                            bind:checked={pub.checked}
                            id="{pub.key}_check"
                            on:click={() => {
                                refresh_svelte_array(publications);
                            }}
                        />
                        <label for="{pub.key}_check">{pub.name}</label>
                    </li>
                {/each}
            </ul>
        </details>
    </span>

    <!-- The New York Times -->
    from
    <span class="year-wrapper">
        <input
            data-old="1975"
            data-clamp="start"
            type="number"
            bind:value={clamps.start}
            on:input={() => handle_year_event("start", "input")}
            on:change={() => handle_year_event("start", "change")}
            class:invalid={is_invalid(clamps.start, "start")}
            min={minmax.start[0]}
            max={minmax.start[1]}
            step="1"
        />
        to
        <input
            class:invalid={is_invalid(clamps.end, "end")}
            data-clamp="end"
            data-old="2000"
            type="number"
            bind:value={clamps.end}
            on:input={() => handle_year_event("end", "input")}
            on:change={() => handle_year_event("end", "change")}
            min={minmax.end[0]}
            max={minmax.end[1]}
        /></span
    >, as a percentage of recorded coverage.
</nav>


<style>
    #search{
        width:100%;
        margin-bottom:20px;
        --lh:30px;
        line-height: var(--lh);
        font-weight:300;
    }

    #publication-dropdown{
        display:inline;
        height:24px;
        max-height:24px;
        overflow:visible;
        position:relative;
    }


    #publication-dropdown details{
        display:inline;
        background-color:var(--ui-bg);
        border-radius:5px;
        padding:0px 4px;
        line-height:24px;
    }

    #publication-dropdown details[open] summary{
        border-bottom: 1px solid #d5d4d4;
    }

    #publication-dropdown details summary,#publication-dropdown details[open] summary{
        position:relative;
        z-index:3;
        display:contents;
        
    }

    #publication-dropdown details summary > * {
        display: inline;
    }

    #publication-dropdown ul{
        z-index:2;
        position:absolute;
        bottom:-10px;
        /* left:50%;
        transform: translate(-50%,100%); */
        left:0;
        transform:translate(0,100%);
        /* border: 1px solid #d5d4d4; */
        
        background-color:var(--ui-bg);
        border-radius:5px;
        padding:0px 4px;
        padding-bottom:2px;
        
        min-width:100%;
        box-sizing:border-box;
        display:flex;
        flex-flow:column nowrap;
        justify-content:flex-start;
        max-height:310px;
        overflow:scroll;
        
    }

    summary{
        cursor:pointer;
    }

    .publication-search{
        background-color:var(--ui-bg);
        padding-top:6px;
        position:sticky;
        
        border-bottom: 1px solid #d5d4d4;
        margin-bottom:-1px;
        top:0;
        order:1;
        z-index:100;
    }

    #publication-dropdown input[type="text"]{
        
        padding:0px 4px;
        width:100%;
        /* background-color:white; */
        font-size: 16px;
        box-sizing:border-box;
    }

    #publication-dropdown ul li{
        position:relative;
        order:30;
    }

    #publication-dropdown ul li label{
        padding: 2px 0px;
        padding-right: 10px;
        color: #545454;
        border-top: 1px solid #d5d4d4;
        font-size:16px;
        cursor:pointer;
        min-width:100%;
        display:block;
        white-space:nowrap;
        box-sizing: border-box;
        z-index:5;
    }

    #publication-dropdown ul li input[type="checkbox"]{
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        cursor:pointer;
        opacity:0;
        margin:0;
        z-index:200;
    }

    #publication-dropdown ul li.hide{
        display:none;
    }

    #publication-dropdown ul li.selected label,#publication-dropdown ul li:hover label{
        color:black;
    }
    #publication-dropdown ul li.only-check{
        pointer-events:none;
    }



    #publication-dropdown ul li.selected{
        /* order:2; */
    }

    #publication-dropdown ul li:hover{
        color:black;
    }

    #publication-dropdown ul li label::before{
        content: '';
        height: 16px;
        width: 16px;
        background-color: white;
        border-radius: 50%;
        border: 3px solid white;
        box-sizing: border-box;
        display: inline-block;
        margin-right: 5px;
        position: relative;
        top: 0.05em;
        pointer-events:none;
        
    }

    #publication-dropdown ul li.selected label::before{
        background-color: black;
    }


    #publication-dropdown details summary::marker,#publication-dropdown details[open] summary::marker{
        display:none;
        content:'';
    }

    input[type="text"],input[type="text"]:focus,input[type="number"],input[type="number"]:focus,.add-more{
        font-family:var(--ff);
        font-size:var(--fs);
        line-height:var(--lh);
        --bg:var(--ui-bg);
        background-color:var(--bg);
        border-radius:5px;
        padding:0px 4px;
        letter-spacing: -0.02em;
        font-weight:300;
    }

    input[type="text"],input[type="text"]:focus{
        border-radius:0;
        --bg:rgba(var(--rgb),0.2);
        border-bottom:1px solid rgba(var(--rgb),1);
    }

    .add-more{
        border-radius:50%;
        /* height:var(--lh); */
        height:24px;
        vertical-align:middle;
        /* margin-left:6px; */
        line-height: 1.25em;
        width:24px;
        /* margin-top: -0.1em; */
        position:relative;
        margin-bottom:1px;
    }

    .add-more.hide{
        display:none;
    }


    input[type="number"],input[type="number"]:focus{
        cursor:ew-resize;
        /* padding:0px 3px; */
        height:calc(var(--lh) * 0.8);
        padding-right: 0;
        width:2.5em;

    }

    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0; 
    }
    input[type=number] {
        -moz-appearance:textfield; /* Firefox */
    }

    input[type="number"].invalid,input[type="number"].invalid:focus{
        background-color:rgba(255,0,0,0.2);
    }


    .search-terms{
        /* display:inline-flex;
        flex-flow:row nowrap;
        justify-content: flex-start;
        align-items:center; */
        margin:0 5px;
    }
    .search-terms:not(.search-terms[data-count="2"])>span:not(span:last-of-type)::after{
        content:', ';
    }
    .search-terms>span:last-of-type:not(span:first-child)::before{
        content:' and ';
    }

    .gram-search-wrapper{
        display:inline-block;
        vertical-align:middle;
        min-width:40px;
        /* min-height:30px; */
        box-sizing:border-box;
        /* display:inline-block; */
        min-height:calc(var(--lh) * 0.8);
        height:calc(var(--lh) * 0.8);
        position:relative;
        top:-1px;
    }

    .width-setter{
        font-family:var(--ff);
        opacity:0;
        white-space: pre;
        vertical-align:middle;
        display:inline-block;
    }

    .gram-search-wrapper input{
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        box-sizing:border-box;
    }

    .gram-search-wrapper,input.gram-search,input.gram-search:focus{
        padding:0px 4px;
    }


    .color1{
        background-color:rgba(var(--col1),0.2);
        border-bottom:1px solid rgb(var(--col1));
    }

    .color2{
        background-color:rgba(var(--col2),0.5);
        border-bottom:1px solid rgb(var(--col2));
    }

    .underline{
        border-bottom:1px solid rgba(0,0,0,0.2);
    }

    .color1,.color2,.underline{
        padding:0 3px;
    }
</style>