<script>
    import {getContext} from 'svelte';
    import QueryButton from './query_button.svelte';
    export let pageid;
    export let content_sections=[];
    export let stories=[];
    export let current_page;
    export let current_section;
    export let include_stories=false;
    export let window_w;
    export let home_sections;

  

    let page;
    
    let button_search=getContext('button_search');
    let go_to=getContext('go_to');

    $:{
        let section=content_sections.find(a=>a.id==current_section);
        if(pageid==current_page&&section&&page){
            let top=section.node.offsetTop-64;
            page.scroll({left:0,top})
        }
    }

    // console.log(home_sections)
    

</script>


<div class="page" id="{pageid}" class:current={pageid==current_page} bind:this={page} class:content={pageid!=='home'}>
    {#if pageid=='home'}
        <header>
            <h1>Wolf Pack: Tracking Media Coverage of Crime and Criminal Justice</h1>
            <p>The Wolf Pack database is built to track the ways in which language was used to describe people, places and events relating to crime and criminal justice in the decades leading up to the era of mass incarceration.</p>
        </header>
        <section>
            <details open>
                <summary class="noselect"><h2>Example searches</h2></summary>
                {#each stories as story}
                    <QueryButton query={story.query} {include_stories} />
                {/each}
            </details>
        </section>
        {#each home_sections as section}
            <section class="content-section">
                <details data-title={section.title}>
                    <summary class="noselect"><h2>{section.title}</h2></summary>
                    {#each section?.text as block,b }
                        {#if block.length>0 }
                            <div class="block" class:br-block={block.includes('<br>')} class:prose-heading={block.includes('<h4>')}>
                                {@html block}
                            </div>
                        {/if}
                    {/each}
                </details>
            </section>
        {/each}
        
        {#if window_w>900}
            <a href="https://brown.columbia.edu/" target="_blank" id="brown-logo"><img alt="The Brown Institute for Media Innovation logo" src="assets/brown-full-logo.png" ></a>
        {/if}
    
    {/if}
    
  </div>



  <style>

    .block{
        display:contents;
    }

    :global(.block br){
        display:none
    }

    h1{
        margin-top:4px;
    }

    :global(h1,h3){
        margin-bottom:12px;
    }
    .page{
        padding:34px 20px;
        padding-right:40px;
        padding-top:0;
        box-sizing:border-box;
        height:100vh;
        overflow-y:scroll;
        transform:translateX(100%);
        position:absolute;
        top:0;
        left:0;
        transition:transform 0.5s;
        width:100%;
        border-left:1px solid var(--article-fg);
        background-color:var(--article-bg);
        color:var(--article-fg);
    }

    #home::before{
        content:'';
        height:30px;
        display:block;
    }

    :global(h3){
        border-bottom:rgba(0,0,0,0.3) 1px solid;
        border-top:rgba(0,0,0,0.3) 1px solid;
        padding-bottom:8px;
        padding-top:8px;
        
        position:sticky;
        top:64px;
        margin-top:0;
        background-color: var(--article-bg);
    }

    .page:not(#home) .content-section{
        /* margin-bottom:40px; */
        padding-bottom:40px;
    }

    

    .story{
        min-height:50vh;
    }

    :global(.content-section p:not(.block.br-block + .block p,.block.prose-heading + .block p,.block:first-of-type p)){
        text-indent:20px;
    }
    :global(.content-section h3){
        margin-bottom: -80px;
    }

    header{
        margin-bottom:15px;
    }

    /* :global(.content-section h3+p){
        margin-top:94px;
    } */

    /* #home{
        transform:translateX(-100%);
    }

    .page.current,#home.current{
        transform:translateX(0%);
    } */

    .page.current,#home{
        transform:translateX(0px);
    }

    .page h2{
        border-top:1px solid var(--article-fg);
        padding-top:10px;
        /* margin-top:20px; */
    }

    .page section:last-of-type{
        border-bottom:1px solid var(--article-fg);
    }

    :global(.page h4){
        font-weight:600;
        margin-top:15px;
        margin-bottom:5px;
    }

    .br-block{
        display: block;
        margin-bottom: 4px;
        height:1px
    }

    /* .page>*{
        margin-bottom:12px;
    } */

    .page section{
        width:100%;
    }

    .page section .to-page{
        font-weight:600;
        color:var(--article-fg);
        text-decoration:none;
        display:block;
        margin-bottom:6px;
        line-height:1.2em;
        /* letter-spacing: -0.02em; */
        text-align:left;
        padding:0;
    }

    .page summary{
        cursor:pointer;
        padding-bottom:10px;
    }

    /* .page summary h2{
        display:block;
        
    } */

    :global(.page p,.page a,.page h4){
        font-family:'TeX Gyre Schola';
        font-size:16px;
        line-height:1.28em;
    }

    :global(.page strong){
        font-weight:600;
    }
    


    .page summary h2::after{
        content:' +'
        
    }

    .page details[open] summary h2::after{
        content:' –'
        
    }

    .page details[open]{
        padding-bottom:20px;
    }

    .page summary::marker{
        content: '';
    }

    #brown-logo{
        position:sticky;
        /* bottom:0px; */
        /* right:36px; */
        display:block;
        float:right;
        top:100vh;
        width:155px;
        transform: translateY(22px);
    }

    #brown-logo img{
        width:100%;
    }

    h2,.page summary::after,.back-button{
        font-size:12px;
        text-transform:uppercase;
        font-weight:500;
        /* margin-bottom:12px; */
        letter-spacing: 0.06em;
        padding:0;
    }

    .sticky-top-wrapper{
        position:sticky;
        top:0;
        background-color:var(--article-bg);
        padding-top:30px;
        z-index:20;
        /* margin-bottom:20px; */
        padding-bottom:10px;
    }

    .back-button{
        
        margin-bottom:0;
        width:100%;
        text-align:left;
    }

    

    


    .neg-margin{
        margin-top:94px;
    }

    :global(.content-section a){
        text-decoration:underline;
        text-underline-offset:2px;
        text-decoration-thickness: 1px;
        color:var(--article-fg);
    }


    @media(max-width:1200px){
        .page{
            padding-right:20px;
        }
    }

    @media(max-width:900px){

        h1{
            margin-bottom:0;
        }

        .t-o-c{
            display:none;
        }
        .page{
            position:relative;
            transition:none;
            transform:none;
            padding-right:15px;
            padding-left:15px;
            height:fit-content;
            border-left:none;
            padding-bottom:0;
            
            
        }

        #home{
            order:1;
            border-top:1px solid var(--article-fg);
        }

        #about{
            order:2;
        }

        #credits{
            order:3;
        }

        #stories{
            order:4;
        }

        .sticky-top-wrapper{
            /* display:none; */
            padding-top:0;

            padding-bottom:0;
        }

        .content-section{
            /* padding-bottom:20px; */
        }

        .page section:last-of-type{
            border-bottom:none;
        }

        #credits .content-section{
            padding-bottom:0;
        }

        #about .neg-margin,#credits .neg-margin{
            margin-top:0;
        }

        #brown-logo{
            /* position:relative; */
            display:block;
            /* left:-5px; */
            bottom:0;
            margin-top:20px;
            margin-bottom:10px;
            transform:translateX(-5px);
            float:unset;
        }

        .story{
            min-height:fit-content;
        }
    }

    

    

</style>