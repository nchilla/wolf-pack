<script>
    import {getContext} from 'svelte';
    import QueryButton from './query_button.svelte';
    export let pageid;
    export let content_sections=[];
    export let stories=[];
    export let current_page;
    export let current_section;
    export let window_w;

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
    

</script>


<div class="page" id="{pageid}" class:current={pageid==current_page} bind:this={page} class:content={pageid!=='home'}>
    {#if pageid=='home'}
        <h1>Wolf Pack: How Media Coverage of Criminal Justice Enabled Mass Incarceration</h1>
        <p>This database uses natural language processing to track the proliferation of sensational language in American media coverage of crime from 1975 to 2000, in order to expose its impacts on the juvenile justice system.</p>
        
        <section>
        <details>
            <summary><h2>How to use</h2></summary>
            <p>You can enter terms in the colored search fields to graph their occurrence over time, and filter the results by publication (e.g. The New York Times), format (e.g. print media), and year.</p>
        </details>
        </section>
        <section class='t-o-c'>
        <h2>Stories</h2>
            {#each stories as story,n}
                <button on:click={go_to} class="to-page" data-page="stories" data-section="story{n+1}">{story.title}</button>
            {/each}
        </section>
        <section class='t-o-c'>
        <h2>Info</h2>
        <button class="to-page" data-page="about" on:click={go_to}>About this project</button>
        <button class="to-page" data-page="credits" on:click={go_to}>Credits</button>
    </section>
    {#if window_w>900}
        <a href="https://brown.columbia.edu/" target="_blank" id="brown-logo"><img alt="The Brown Institute for Media Innovation logo" src="assets/brown-full-logo.png" ></a>
    {/if}
    
    {:else}
        <div class='sticky-top-wrapper'>
            
            {#if window_w<=900}
                <h2>{pageid}</h2>
            {:else}
                <button class="to-page back-button" data-page="home" on:click={go_to}>&lt; contents</button>
            {/if}
        
        </div>
        
        
        {#each content_sections as section,n}
            <section class='content-section' data-storyid="{pageid=='stories'?section.id:''}" class:story={pageid=='stories'} bind:this={section.node}>
                {#each section.text as block,i}
                    {#if i==1}<div class='neg-margin'></div>{/if}
                    {#if typeof block == 'object'}
                        <QueryButton query={block} />
                      <!-- <button on:click={()=>button_search(block)}  class='graph-input'>Mentions of {@html generate_term_html(block.terms)} by <span class="underline">{block.pub_string}</span> from <span class="underline">{block.clamps.start}</span> to <span class="underline">{block.clamps.end}</span>
                        <span class="reset-chart">reset chart</span>
                      </button> -->
                    {:else}
                        {@html block}
                    {/if}
                    
                {/each}
                
            </section>
            
        {/each}
    
        {#if window_w<=900&&pageid=='credits'}
            <a href="https://brown.columbia.edu/" target="_blank" id="brown-logo"><img alt="The Brown Institute for Media Innovation logo" src="assets/brown-full-logo.png" ></a>
        {/if}
    {/if}
    
    <!-- <h3>Story 1 TK</h3> -->
    

    <!-- <button class='graph-input'>Mentions of <span class="color1">youth</span> and <span class="color2">juvenile</span> by <span class="underline">all publications</span> from <span class="underline">1980</span> to <span class="underline">2000</span>

      <span class="reset-chart">reset chart</span>
    </button>
    <p class="mock">Sharletta Evans lost her three-year-old son in a hail of bullets one torturous December evening in 1995. The Colorado mother had pulled her car up in front of a northeast Denver house, intending to dash inside to pick up her niece’s baby girl, to bring her out of harm’s way. Gunfire on the street the night before had frightened everyone in the house.</p>
    <p class="mock">On this night, a small, white car carrying three teenagers cruised to a stop in front of the house in Park Hill, on a block scarred by violence since the mid-1980s. Two teens emerged and opened fire, spraying the house they thought was filled with rival gang members.* Little Casson Xavier, nicknamed “Biscuit,” was shot as he slept in his car seat next to his six-year-old brother. Evans cradled her toddler in her arms as he bled to death before emergency medical workers could arrive. “He took his last breath in my arms,” Evans remembered recently with painful clarity. “Still, I thought they could revive him.”</p> -->
  </div>



  <style>

    

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
        border-left:1px solid black;
        background-color:var(--article-bg);
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

    .content-section{
        /* margin-bottom:40px; */
        padding-bottom:40px;
    }

    .story{
        min-height:50vh;
    }

    :global(.content-section p){
        margin-bottom:12px;
    }
    :global(.content-section h3){
        margin-bottom: -80px;
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
        border-top:1px solid black;
        padding-top:3px;
        margin-top:34px;
    }

    /* .page>*{
        margin-bottom:12px;
    } */

    .page section{
        width:100%;
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

    .page summary{
        cursor:pointer;
    }

    /* .page summary h2{
        display:block;
        
    } */

    :global(.page p){
        font-family:'TeX Gyre Schola';
        font-size:16px;
        line-height:1.28em;
    }
    


    .page summary h2::after{
        content:' +'
        
    }

    .page details[open] summary h2::after{
        content:' -'
        
    }

    .page summary::marker{
        content: '';
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

    h2,.page summary::after,.back-button{
        font-size:12px;
        text-transform:uppercase;
        font-weight:500;
        margin-bottom:12px;
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

    @media(max-width:900px){

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
            border-top:1px solid black;
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
            padding-bottom:20px;
        }

        #credits .content-section{
            padding-bottom:0;
        }

        #about .neg-margin,#credits .neg-margin{
            margin-top:0;
        }

        #brown-logo{
            position:relative;
            display:block;
            left:-5px;
            bottom:0;
            margin-top:20px;
        }

        .story{
            min-height:fit-content;
        }
    }

    

    

</style>