<script>
    import {onMount,setContext} from 'svelte';
    
    import * as marked from 'marked';
    import GraphElement from '$lib/components/graph.svelte';
    import SearchInterface from '$lib/components/search_interface.svelte'
    import SidebarPage from '$lib/components/sidebar_page.svelte'
    import {process_data} from '$lib/graph.js';
    
    let graph;

    export let data;
    let stories=data.stories;

    console.log(stories);

    let doc;

    let current_page='home';
    let current_section='';



    // publication management ===========================================

    import publications_json from '$lib/publications-tags.json';
    let publications=publications_json;

    
    

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
    setContext('refresh_svelte_array',refresh_svelte_array)

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


    // years ===================================
 
    let clamps={
        start:1975,
        end:2000
    }

    let minmax={
        start:[1975,1998],
        end:[1977,2000]
    }

    // search ===================================
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
                
                console.log(graph);
                if(graph) graph.update(terms);
            }
            
        });
    }

    setContext('search',search)


    // onmount
    onMount(()=>{
        doc=document;
        // graph = new Graph(d3.select('#graph'),undefined,clamps);
        console.log('!!! initialization !!!')
        search();
    })

</script>


<main>
    <section id="graph-column">
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
      <GraphElement bind:clamps bind:graph />
      <div id="bottom-area">
        <button>Download chart data</button>
        <button>Save as image</button>
        <button class="to-page" data-href="#methodology">Learn about how this data was collected and indexed →</button>
      </div>
    </section>
    <article id="content-column">
      <SidebarPage 
        pageid="home" 
        {stories} 
        bind:current_page
        bind:current_section
      />
      <SidebarPage
        pageid="stories" 
        content_sections={stories}
        bind:current_page
        bind:current_section
      />
      <SidebarPage 
        pageid="about" 
        bind:current_page
        bind:current_section
      />
      <SidebarPage 
        pageid="credits" 
        bind:current_page
        bind:current_section
      />
      <!-- <div class="page" id="stories">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        
        {#each stories as story,n}
            <div id="story{n+1}" class='story'>
                {#each story.story as paragraph}
                    {@html paragraph}
                {/each}
                
            </div>
            
        {/each}
        
      </div> -->
      <!-- <div class="page" id="about">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>About</h3>
      </div>
      <div class="page" id="methodology">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
        <h3>Methodology</h3>
      </div>
      <div class="page" id="credits">
        <button class="to-page back-button" data-href="#home">&lt; contents</button>
      </div> -->
      
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
        /* min-width:480px; */
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

   


    :global(.page p){
        font-family:'TeX Gyre Schola';
        font-size:16px;
        line-height:1.28em;
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

    #bottom-area .to-page{
        color:#9E9E9E;
        
        
    }




    /* type---------------- */

    :global(h1,#search,h3){
        --fs:20px;
        font-size:20px;
        letter-spacing: -0.02em;
        
    }

    :global(h1,h3){
        font-weight:600;
    }

    


    

    
</style>