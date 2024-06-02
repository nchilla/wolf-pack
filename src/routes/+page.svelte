<script>
    import {onMount,setContext} from 'svelte';
    
    import * as marked from 'marked';
    import GraphElement from '$lib/components/graph.svelte';
    import SearchInterface from '$lib/components/search_interface.svelte'
    import SidebarPage from '$lib/components/sidebar_page.svelte'
    import {process_data} from '$lib/graph.js';
    
    let graph;

    export let data;
    // export let include_stories;
    let stories=data.stories;
    for(let story of stories){
        let query=story.text.find(a=>typeof a == 'object');
        story.query=query;
    }
    let {
        home_sections
    } = data;

    


    let doc;

    let current_page='home';
    let current_section='';

    let threshold = 0.5;

    let graph_state='loading';



    let window_w;
    let download_data_button;

    // publication management ===========================================

    import publications_json from '$lib/publications-tags.json';
    let publications=publications_json;

    for(let story of stories){
        for(let block of story.text){
            if(typeof block == 'object'){
                block.pubs=publications.filter(a=>block.pub_keys.includes(a.key));
                block.pub_string=generate_pub_string(block.pubs);
            }
        }
    }
    

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
    }
    
    $: selected_pubs=publications.filter(a=>a.selected);
    $: summary_string=generate_pub_string(selected_pubs);
    
    function generate_pub_string(pubs){
        let names=pubs.map(a=>a.type=='sum'?a.name.toLowerCase():a.name);
        if(names.length>1) names[names.length - 1]='and '+names[names.length - 1];
        return names.join(names.length>2?', ':' ');
    }

    setContext('generate_pub_string',generate_pub_string)


    let pub_cache=flatten_pub_list(selected_pubs);

    $:{
        if(flatten_pub_list(selected_pubs)!==pub_cache){
            pub_cache=flatten_pub_list(selected_pubs);
            if(doc) search();
        }else{
            // console.log('no change to selected')
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
    setContext('refresh_svelte_array',refresh_svelte_array)

    // terms ================================================
    let term_focused;


    let terms=[
        {gram:'gang',old:'',color:'253, 35, 244',visible:true,plot:[],node:undefined,i:0},
        {gram:'',old:'',color:"26, 230, 206",visible:false,plot:[],node:undefined,i:1},
        {gram:'',old:'',color:'254, 198, 0',visible:false,plot:[],node:undefined,i:2},
        {gram:'',old:'',color:'55, 155, 53',visible:false,plot:[],node:undefined,i:3},
        {gram:'',old:'',color:'102, 73, 73',visible:false,plot:[],node:undefined,i:4}
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
        // console.log('already focused or undefined')
    }



    function button_search(query){
        terms.forEach((term,i)=>{
            if(query.terms[i]) term.gram=query.terms[i];
            else term.gram=''
        })
        terms=terms;
        clamps.start=query.clamps.start;
        clamps.end=query.clamps.end;
        setminmax(clamps.start,'start');
        setminmax(clamps.end,'end');

        publications.forEach((pub)=>{
            pub.checked=query.pub_keys.includes(pub.key)
        })
        publications=publications;
        // clamps=clamps;
        search();

    }

    setContext('button_search',button_search);

    // years ===================================
 
    let clamps={
        start:1975,
        end:2000
    }

    let minmax={
        start:[1975,1998],
        end:[1977,2000]
    }

    function is_invalid(v,which){
        return v<minmax[which][0]||v>minmax[which][1];
    }

    function setminmax(v,which){
        if(which=='start') minmax.end[0]=v+2;
        else minmax.start[1]=v-2;
    }

    setContext('is_invalid',is_invalid);
    setContext('setminmax',setminmax);
    

    let graph_column_width;

    // search ===================================
    function search(){
        let query={
            terms:terms.filter(a=>a.gram.length>0).map(a=>a.gram),
            publications:selected_pubs
        }
        // console.log('query:',query)
        graph_state='loading';

        fetch('/search',{
            method:'POST',
            headers:{
                'Content-Type': 'application/json'
            },
            body:JSON.stringify(query)
        })
        .then((response) => response.json())
        .then((json) => {
            let termlist=json.terms;

            let find_invalid=termlist.find(a=>
                a==null 
                || a.response_type=='insufficient data' 
                || a.data.length<=10
            )

            if(!find_invalid){
                let plots=process_data(termlist);
                terms.map(term=>{
                    term.plot=plots.find(a=>a.gram==term.gram)?.plot;
                })

                let downloadable_json={
                    publications_searched:selected_pubs.map(a=>a.name),
                    data_by_term:terms.filter(a=>a.gram.length>0).map(({gram,plot})=>{
                        return {
                            term:gram,
                            plot
                        }
                    })
                }

                let json_str="data:text/json;charset=utf-8,"+encodeURIComponent(JSON.stringify(downloadable_json))

                download_data_button.setAttribute('href',json_str);


                graph_state='graph';
                
                
                if(graph) update_graph(terms)
            }else{
                graph_state='no-data';
                download_data_button.setAttribute('href','json_str');
            }
            
        });
    }

    setContext('search',search)
    
    function update_graph(){
        if(!is_invalid(clamps.start,'start')&&!is_invalid(clamps.end,'end')){
            graph.update(terms);
        }
    }
    setContext('update_graph',update_graph)

    function go_to_howtouse(e){
        Array.from(document.querySelectorAll('.page details')).forEach((accordion)=>{
            if(accordion.dataset.title=='How to use this database'){
                accordion.open=true;
                document.querySelector('.page').scroll({
                    top:accordion.offsetTop - 20,
                    behavior:'smooth'
                })
            }


        })
        
    }


    // onmount
    onMount(()=>{
        doc=document;
        // graph = new Graph(d3.select('#graph'),undefined,clamps);

        if(data.include_stories){
            let observer = new IntersectionObserver(story_callback, {
                root:doc.querySelector('#stories'),
                threshold: [0, 0.01, 0.1, 0.5, 0.9,0.99, 1],
                rootMargin: `${doc.querySelector('#stories').scrollHeight * 10}px 0px -${(1 - threshold) * 100}% 0px`
            });
            
            let stories = Array.from(document.querySelectorAll('.story'));
            for (let story of stories) observer.observe(story);
        }
        
		

        search();
    })

    let buffered_change;


    function story_callback(entries){
        if(window_w>900){
            for (let entry of entries) {
                let top = entry.boundingClientRect.top;
                let bottom = entry.boundingClientRect.bottom;
                let windowThreshold = window.innerHeight * threshold;
                if (top < windowThreshold && bottom > windowThreshold && current_page=='stories'){
                    let story=stories.find(a=>a.id==entry.target.dataset.storyid );
                    let query=story.text.find(a=>typeof a == 'object');
                    
                    if(buffered_change) clearTimeout(buffered_change);
                    buffered_change=setTimeout(()=>{
                        button_search(query)
                    },100)
                    
                }
                    
            }
        }
        
    }

</script>

<svelte:window bind:innerWidth={window_w}/>

<main 
    style:--col1={terms[0].color} 
    style:--col2={terms[1].color}
    style:--col3={terms[2].color}
    style:--col4={terms[3].color}
    style:--col5={terms[4].color}
    >
    <section id="graph-column" bind:offsetWidth={graph_column_width} style='--w:{graph_column_width}px;'>
      <SearchInterface 
        bind:pub_search_term 
        bind:terms 
        bind:term_focused 
        bind:clamps 
        bind:minmax
        bind:publications
        {visible_terms} 
        {summary_string}
        {doc}
      />
      <GraphElement bind:clamps bind:graph {graph_state} />
      <div id="bottom-area">
        <a id="download-data" bind:this={download_data_button} href="/" download="wolf_pack_percentage_data.json">Download chart data</a>
        <!-- <button>Save as image</button> -->
        <button class="to-page" data-page="about" on:click={go_to_howtouse}>Learn about how this data was collected and indexed →</button>
      </div>
    </section>
    <article id="content-column">
      <SidebarPage 
        pageid="home" 
        {stories} 
        bind:current_page
        bind:current_section
        include_stories={data.include_stories}
        {window_w}
        {home_sections}
      />

      {#if data.include_stories}
      <SidebarPage
        pageid="stories" 
        content_sections={stories}
        bind:current_page
        bind:current_section
        include_stories={data.include_stories}
        {window_w}
        />
      {/if}
      
    </article>
  </main>

<style>
    :root{
        --ui-bg:#F1F1F1;
        --article-bg:#EEEEEE;
        --article-fg:#010101;
    }

    




    main{
        width:100%;
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
        min-width:380px;
        flex:1;
        overflow:hidden;
        height:100vh;
        box-sizing:border-box;
        position:relative;
    }

    article::before{
        content:'';
        display:block;
        width:100%;
        height:1px;
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

    

    :global(#graph-column>*){
        /* max-width:min(100%,700px); */
        min-width:0px;
        width:100%;
        align-self:center;
    }


    

    :global(button){
        background-color:none;
        padding:0px 6px;
        border-radius:4px;
    }

    





   

    

    


    #input-ruler{
        opacity:0;
        pointer-events:0;
        position:absolute;
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

    #bottom-area a{
        color:black;
    }

    #bottom-area .to-page{
        color:#9E9E9E;
        
        
    }




    /* type---------------- */

    :global(h1,#search,h3){
        --fs:20px;
        font-size:var(--fs);
        letter-spacing: -0.02em;
        
    }

    :global(h1,h3){
        font-weight:600;
    }

    
    @media(max-width:1200px){
        #graph-column{
            padding-left:20px;
        }

        #bottom-area{
            
            padding-left:20px;
        }
    }

    @media(max-width:900px){
        main{
            flex-flow:column nowrap;
            align-items:flex-start;
            /* overflow:scroll; */
        }

        :global(h1,#search,h3){
            --fs:18px;
            --lh:28px;
            /* letter-spacing:0; */
        }

        #bottom-area{
            position:relative;
            padding-top:30px;
            padding-left:0;
            padding-bottom: 10px;
            
        }

        #bottom-area .to-page{
            text-align: left;
            white-space:unset;
        }

        article{
            width:100%;
            max-width:100%;
            min-width:100%;
            display:flex;
            flex-flow:column nowrap;
            /* overflow:hidden; */
        }

        

        #graph-column{
            overflow:hidden;
            padding-bottom:0px;
            max-width:100%;
            padding:20px 15px;
            max-height:fit-content;
            position:relative;
        }

        main::after{
            display:none;
        }
    }

    

    
</style>