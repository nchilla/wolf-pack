<script>
    import * as d3 from 'd3';
    import {onMount} from 'svelte';
    import {Graph} from '$lib/graph.js';

    export let graph;
    export let graph_state;

    $:{
        if(graph){
            graph.clamps=clamps;
            graph.update();
        }
    }




    export let clamps;

    
    // let search=getContext('search');

    onMount(()=>{
        graph = new Graph(d3.select('#graph'),undefined,clamps);
    })
</script>

<figure id="graph-wrapper" data-state="{graph_state}">
 
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
    <div id="graph-state-overlay" class='{graph_state}'>
      <p class='loading-msg msg'>
        <span>Loading data...</span>
      </p>
      <p class='no-data msg'>
        <span>Insufficient data to graph.</span>
      </p>
    </div>
    <figcaption>brown.columbia.edu/wolfpack</figcaption>
  </figure>


  <style>
    #graph-wrapper{
        width:calc(100% - 85px);
        position:relative;
    }

    :global(#graph-wrapper .paths){
      opacity:0;
    }


    :global(#graph-wrapper[data-state="graph"] .paths){
      opacity:1;
    }

    
    .msg{
      opacity:0;
        position:absolute;
        bottom:10px;
        left:20px;
        font-size:20px;
        white-space: nowrap;
        background-color: white; 
    }

    .loading-msg span{
        display:inline-block;
        width:121px;
        overflow:hidden;

        animation: ellipsis steps(4, end) 1.5s infinite;
    }

    #graph-wrapper[data-state="loading"] .msg.loading-msg{
        opacity:1;
    }

    #graph-wrapper[data-state="no-data"] .msg.no-data{
        opacity:1;
    }

    @keyframes ellipsis {
      to {
        width: 140px;
      }
    }

    

    #graph-state-overlay{
      width: calc(100% + 80px);
      height: calc(100% - 21px);
      position: absolute;
      top: 0px;
      left: 13px;
      z-index: 100;
    }

    #graph-state-overlay.loading{
      /* background-color: white; */
    }

    #graph{
        position:absolute;
        left:-40px;
    }

    figcaption{
        position:absolute;
        top:0;
        right:0;
        background-color:white;
        color:#9E9E9E;
        font-size:12px;
    }

    @media(max-width:1200px){
      figcaption{
        right:-35px;
      }
    }

    

  </style>