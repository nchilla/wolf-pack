<script>
    import * as d3 from 'd3';
    import {onMount} from 'svelte';
    import {Graph} from '$lib/graph.js';

    export let graph;

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


  <style>
    #graph-wrapper{
        width:calc(100% - 85px);
        position:relative;
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

    

  </style>