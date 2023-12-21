<script>
    import {onMount} from 'svelte';
    import * as d3 from 'd3';
    import {Graph,process_data} from '$lib/graph.js';
    

    let doc;
    let graph;
    



    // publication management ===========================================

    import publications_json from '$lib/publications-tags.json';
    let publications=publications_json;

    
    let term_timer;

    publications.sort((a,b)=>{
        let a_type_int=a.type=='sum'?1:0;
        let b_type_int=b.type=='sum'?1:0;
        return  b_type_int - a_type_int;
    });
    publications.forEach(pub=>{
        pub.checked=pub.key=='_sum_all_publications';
    })
    let sum_pubs=publications.filter(a=>a.type=='sum')
    $: all_pubs=publications.find(a=>a.key=='_sum_all_publications')

    $:{
        // let matching=publications.filter
        sum_pubs.forEach(pub=>{
            pub.selected=pub.checked;
            if(!pub.selected){
                let pubs_matching=publications.filter(a=>{
                    return a.type=='publication'&&(pub.match=='*'||a.tags.includes(pub.match))
                })
                let pubs_matching_and_selected=pubs_matching.filter(a=>a.checked);
                pub.selected=pubs_matching.length == pubs_matching_and_selected.length;
            }
            if(pub.selected&&pub.key!=='_sum_all_publications'&&all_pubs.checked) pub.selected=false;
        })

        publications.forEach(pub=>{
            if(pub.type=='publication'){
                pub.selected=pub.checked;
                if(pub.selected){
                    pub.selected=!sum_pubs.find(a=>{
                        return a.selected&&(a.match=='*'||pub.tags.includes(a.match))
                    })
                }
            }

        })
        console.log(publications.filter(a=>a.selected));
    }

   
   

    $: checked_pubs=publications.filter(a=>a.checked);
    $: selected_pubs=publications.filter(a=>a.selected);
    $: selected_strings=selected_pubs.map(a=>a.type=='sum'?a.name.toLowerCase():a.name);
    $: if(selected_strings.length>1) selected_strings[selected_strings.length - 1]='and '+selected_strings[selected_strings.length - 1];
    $: summary_string=selected_strings.join(selected_pubs.length>2?', ':' ');
    
    let pub_cache=flatten_pub_list(selected_pubs);

    $:{
        if(flatten_pub_list(selected_pubs)!==pub_cache){
            pub_cache=flatten_pub_list(selected_pubs);
            if(doc) search();
        }else{
            console.log('no change to selected')
        }
    }
   
    let pub_search_term='';
    $:{
        publications.forEach((pub)=>{
            pub.search_match=pub_search_term.length<1||pub.name.toLowerCase().includes(pub_search_term.toLowerCase())
        })
        publications=publications;

    }


    function flatten_pub_list(pubs=[]){
        return JSON.stringify(pubs.map((a)=>a.key))
    }
  
    function refresh_svelte_array(arr){
        arr=arr;
    }

    // terms ================================================
    let term_focused;


    let terms=[
        {gram:'youth',old:'',color:'255, 0, 245',visible:true,plot:[],node:undefined,i:0},
        {gram:'',old:'',color:"0, 255, 224",visible:false,plot:[],node:undefined,i:1},
        {gram:'',old:'',color:'102, 73, 73',visible:false,plot:[],node:undefined,i:2},
        {gram:'',old:'',color:'67, 150, 66',visible:false,plot:[],node:undefined,i:3},
        {gram:'',old:'',color:'254, 198, 0',visible:false,plot:[],node:undefined,i:4}
    ];

    $:{
        terms.forEach((term)=>{
            term.visible=term.i==0||term.i==term_focused||term.gram.length>0
        })
        terms=terms;
    }
    $:visible_terms=terms.filter(a=>a.visible)
    

    $:if(term_focused!==undefined&&terms[term_focused].node!==doc?.activeElement){
        requestAnimationFrame(()=>{
            terms[term_focused].node.focus();
        })
    }else{
        console.log('already focused or undefined')
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

    function toggle_focus(i,val){
        console.log('toggle')
        term_focused=val?i:undefined;

        // graph.update();
        // graph.update(terms);
        
        if((!val)&&visible_terms.length>1&&terms[0].gram.length<1){
            terms.forEach((term,t)=>{
                if(t>0) terms[t-1].gram=term.gram;
            })
        }
        
    
    }

    function add_term(){
        console.log(visible_terms.length,terms[visible_terms.length])
        term_focused=visible_terms.length;
    }


    

    // years ===================================
 

    let clamps={
        start:1975,
        end:2000
    }

    $:{
        if(graph){
            graph.clamps=clamps;
            graph.update();
        }
    }
    let minmax={
        start:[1975,1998],
        end:[1977,2000]
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

    // search =================================================


    function search(){
        let query={
            terms:terms.filter(a=>a.gram.length>0).map(a=>a.gram),
            publications:selected_pubs
        }
        console.log('query:',query)
        fetch('/search',{
            method:'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(query)
        })
        .then((response) => response.json())
        .then((json) => {
            console.log('response:',json)
            if(json.terms.filter(a=>a!==null).length>0){
                let plots=process_data(json.terms);
                terms.map(term=>{
                    term.plot=plots.find(a=>a.gram==term.gram)?.plot;
                })
                
                graph.update(terms);
            }
            
        });
    }


    // onmount
    onMount(()=>{
        doc=document;
        graph = new Graph(d3.select('#graph'),undefined,clamps);
        console.log('!!! initialization !!!')
        search();
    })

</script>


<main>
    <section id="graph-column">
      <nav id="search">
        Mentions of 
        <span class="search-terms" data-count="{visible_terms.length}">
            {#each terms as term}
                {#if term.visible}
                    <span class="wrapper-wrapper">
                        <span class="gram-search-wrapper">
                            <span class="width-setter">{term.gram}</span>
                            <input type="text" class="gram-search" 
                                on:focus={()=>toggle_focus(term.i,true)}
                                on:focusout={()=>toggle_focus(term.i,false)}
                                on:input={()=>term_input(term)}
                                bind:value={term.gram}
                                bind:this={term.node}
                                data-old=""
                            style="--rgb: {term.color}">
                        </span>
                    </span>
                {/if}
            {/each}
            <button class="add-more" class:hide={visible_terms.length>4} on:click={add_term}>+</button>
        </span> in crime reporting by 
        
        <span id="publication-dropdown">
          <details  class="noselect">
            <summary>{summary_string}</summary>
              <ul>
                <div class="publication-search"><input type="text" placeholder="search" bind:value={pub_search_term}></div>
                {#each publications as pub}
                    <li class:selected={pub.checked} class:hide={!pub.search_match&&!pub.checked} class:only-check={checked_pubs.length==1&&pub.checked}>
                        <input type="checkbox" bind:checked={pub.checked} id='{pub.key}_check' on:click={()=>{refresh_svelte_array(publications)}}>
                        <label for='{pub.key}_check'>{pub.name}</label>
                    </li>
                {/each}
              </ul>
          </details>
          

        </span>
        
        <!-- The New York Times -->
        from <span class="year-wrapper">
            <input 
                data-old="1975" 
                data-clamp="start" 
                type="number" 
                bind:value={clamps.start} 
                on:input={()=>handle_year_event('start','input')}
                on:change={()=>handle_year_event('start','change')}
                class:invalid={is_invalid(clamps.start,'start')} 
                min={minmax.start[0]}
                max={minmax.start[1]} 
                step="1"
            >
             to 
            <input 
                class:invalid={is_invalid(clamps.end,'end')} 
                data-clamp="end" 
                data-old="2000" 
                type="number" 
                bind:value={clamps.end} 
                on:input={()=>handle_year_event('end','input')}
                on:change={()=>handle_year_event('end','change')}
                min={minmax.end[0]}
                max={minmax.end[1]} 
            ></span>, as a percentage of recorded coverage.
      </nav>
      <figure id="graph-wrapper">
 
        <svg id="graph">
          <style>
            .paths path{
              stroke:black;
              stroke-width:1px;
              fill:none;
              stroke-linecap:round;
              stroke-linejoin:round;
            }
            .tick text{
                font-size: 12px;
                --ff:'Public Sans', sans-serif;
                font-family:var(--ff);
            }
            
            #x-axis-years .tick text,#x-axis-years .domain{
                display:none;
            }
            
            #x-axis-years line{
                stroke:#E2E2E2;
            }

  
            
          </style>
          <marker
            id="dot"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            vector-effect="non-scaling-size"
            markerWidth="3"
            markerHeight="3">
            <circle cx="5" cy="5" r="5" fill="red" />
          </marker>
          <g id="x-axis-years"></g>
          <g id="x-axis"></g>
          <g id="y-axis"></g>
        </svg>
        <figcaption>brown.columbia.edu/wolfpack</figcaption>
      </figure>
      <div id="bottom-area">
        <button>Download chart data</button>
        <button>Save as image</button>
        <button class="to-page" data-href="#methodology">Learn about how this data was collected and indexed →</button>
      </div>
    </section>
    <article id="content-column">
      <div id="home" class="page current">
        <h1>Wolf Pack: How Media Coverage of Criminal Justice Enabled Mass Incarceration</h1>
        <p>This database uses natural language processing to track the proliferation of sensational language in American media coverage of crime from 1975 to 2000, in order to expose its impacts on the juvenile justice system.</p>
        
        <section>
          <details>
            <summary><h2>How to use</h2></summary>
            <p>You can enter terms in the colored search fields to graph their occurrence over time, and filter the results by publication (e.g. The New York Times), format (e.g. print media), and year.</p>
          </details>
          


        </section>
        <section>
          <h2>Stories</h2>
          <button class="to-page" data-href="#story1">Story 1 TK</button>
          <button class="to-page" data-href="#story2">Story 2 TK</button>
          <button class="to-page" data-href="#story3">Story 3-X TK</button>
        </section>
        <section>
          <h2>Info</h2>
          <button class="to-page" data-href="#about">About this project</button>
          <button class="to-page" data-href="#credits">Credits</button>
        </section>


        <a href="https://brown.columbia.edu/" target="_blank" id="brown-logo"><img src="assets/brown-full-logo.png" ></a>
      </div>
      <div class="page" id="story1">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>Story 1 TK</h3>
        <button class='graph-input'>Mentions of <span class="color1">youth</span> and <span class="color2">juvenile</span> by <span class="underline">all publications</span> from <span class="underline">1980</span> to <span class="underline">2000</span>

          <span class="reset-chart">reset chart</span>
        </button>
        <p class="mock">Sharletta Evans lost her three-year-old son in a hail of bullets one torturous December evening in 1995. The Colorado mother had pulled her car up in front of a northeast Denver house, intending to dash inside to pick up her niece’s baby girl, to bring her out of harm’s way. Gunfire on the street the night before had frightened everyone in the house.</p>
        <p class="mock">On this night, a small, white car carrying three teenagers cruised to a stop in front of the house in Park Hill, on a block scarred by violence since the mid-1980s. Two teens emerged and opened fire, spraying the house they thought was filled with rival gang members.* Little Casson Xavier, nicknamed “Biscuit,” was shot as he slept in his car seat next to his six-year-old brother. Evans cradled her toddler in her arms as he bled to death before emergency medical workers could arrive. “He took his last breath in my arms,” Evans remembered recently with painful clarity. “Still, I thought they could revive him.”</p>
      </div>
      <div class="page" id="story2">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>Superpredator: The Media Myth That Demonized a Generation of Black Youth</h3>
      </div>
      <div class="page" id="story3">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>Superpredator: The Media Myth That Demonized a Generation of Black Youth</h3>
      </div>
      <div class="page" id="about">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>About</h3>
      </div>
      <div class="page" id="methodology">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>Methodology</h3>
      </div>
      <div class="page" id="credits">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
      </div>
      
    </article>
  </main>

<style>
    :root{
        --ui-bg:#F1F1F1;
        --article-bg:#EEEEEE;
    }

    :global(body){
        /* temp */
        /* --ff:'Libre Franklin', sans-serif; */
        --ff:'Public Sans', sans-serif;
        font-family:var(--ff);
        --fs:16px;
        font-size:var(--fs);
        --lh:23px;
        line-height:var(--lh);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;


        --col1:255, 0, 245;
        --col2:0, 255, 224;
    }



    main{
        width:100vw;
        display:flex;
        flex-flow:row nowrap;
        align-items:flex-start;
        padding:0px;
        box-sizing:border-box;
    }

    main::after{
        position:absolute;
        /* background-color:var(--article-bg); */
        top:0;
        right:0;
        width:21px;
        height:100vh;
        content:'';
    }


    article{
        max-width:480px;
        /* min-width:480px; */
        flex:1;
        border-left:1px solid black;
        background-color:var(--article-bg);
        overflow:hidden;
        height:100vh;
        box-sizing:border-box;
        position:relative;
    }

    .page{
        padding:34px 20px;
        padding-right:40px;
        box-sizing:border-box;
        height:100vh;
        overflow:scroll;
        transform:translateX(100%);
        position:absolute;
        top:0;
        left:0;
        transition:transform 0.5s;
        width:100%;
    }

    #home{
        transform:translateX(-100%);
    }

    .page.current,#home.current{
        transform:translateX(0%);
    }

    .page>*{
        margin-bottom:12px;
    }


    .page p{
        font-family:'TeX Gyre Schola';
        font-size:16px;
        line-height:1.28em;
    }

    .page section{
        border-top:1px solid black;
        width:100%;
        padding-top:3px;
        margin-top:37px;
    }



    .page section .to-page{
        font-weight:600;
        color:black;
        text-decoration:none;
        display:block;
        margin-bottom:6px;
        line-height:1.2em;
        /* letter-spacing: -0.02em; */
        text-align:left;
        padding:0;
    }

    summary{
        cursor:pointer;
        /* display:flex; */
        /* display:inline; */
        /* flex-flow:row nowrap; */
    }

    #content-column summary h2{
        display:inline-block;
        
    }


    #content-column summary::after{
        content:' +'
        
    }

    #content-column details[open] summary::after{
        content:' -'
        
    }

    .page summary::marker{
        content: '';
    }



    #graph-column{
        flex:2;
        padding-top:30px;
        display:flex;
        flex-flow:column nowrap;
        justify-content: flex-start;
        align-items:center;
        padding:30px 20px;
        padding-left:40px;
        position:sticky;
        top:0;
        max-height:100vh;
        height:100vh;
        box-sizing:border-box;
    }

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

    #graph-column>*{
        /* max-width:min(100%,700px); */
        min-width:0px;
        width:100%;
        align-self:center;
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

    button{
        background-color:none;
        padding:0px 6px;
        border-radius:4px;
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


    /* .search-terms>*:not(span:first-child){
        margin-left:6px;
    } */


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


    #input-ruler{
        opacity:0;
        pointer-events:0;
        position:absolute;
    }

    #graph-wrapper{
        width:calc(100% - 85px);
        position:relative;
    }



    figcaption{
        position:absolute;
        top:0;
        right:0;
        background-color:white;
        color:#9E9E9E;
        font-size:12px;
    }

    #graph{
        /* width:100%;
        min-width:100%; */
        position:absolute;
        left:-40px;
        /* border-bottom:1px solid black;
        border-left:1px solid black; */
    }





    #brown-logo{
        position:absolute;
        bottom:0px;
        right:36px;
        width:155px;
    }

    #brown-logo img{
        width:100%;
    }


    #bottom-area{
        position:absolute;
        bottom:0;
        left:0;
        width:100%;
        padding:20px 40px;
        box-sizing:border-box;
        display:flex;
        flex-flow:row wrap;
        justify-content: flex-start;
    }

    #bottom-area button,#bottom-area a{
        text-decoration:underline;
        text-underline-offset:4px;
        padding:0px;
        padding-top:5px;
        margin-right:15px;
        white-space:nowrap;
    }

    #bottom-area .to-page{
        color:#9E9E9E;
        
        
    }




    /* type---------------- */

    h1,#search,h3{
        --fs:20px;
        font-size:20px;
        letter-spacing: -0.02em;
        
    }

    h1,h3{
        font-weight:600;
    }

    h2,#content-column summary::after,.back-button{
        font-size:12px;
        text-transform:uppercase;
        font-weight:500;
        margin-bottom:12px;
        letter-spacing: 0.06em;
        padding:0;
    }


    .reset-chart{
        color:#8A8A8A;
        text-transform:uppercase;
        letter-spacing: 0.06em;
        font-size:12px;
        font-weight:500;
        display:block;
        margin-top:10px;
    }

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
    }

    @media(hover:hover){
        .graph-input:hover{
            border:1px solid black;
        }

        .graph-input:hover .reset-chart{
            color:black;
        }
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