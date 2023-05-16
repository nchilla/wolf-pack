console.log('hi')

let timer;


let terms=[
    {gram:'crime',color:'133, 122, 255',visible:true},
    {gram:'',color:"255, 187, 147",visible:false},
    {gram:'',color:'102, 73, 73',visible:false},
    {gram:'',color:'67, 150, 66',visible:false},
    {gram:'',color:'254, 198, 0',visible:false}
];

let graph;

let clamp={
    min:1975,
    max:2000
}

const parse_date=d3.timeParse("%Y_%m");
let search_term_selection=d3.select('.search-terms').selectAll('.gram-search');

window.addEventListener('load',init)


function update_search_entry(){
    d3.select('.search-terms').attr('data-count',terms.filter(a=>a.visible).length)
    let search_term_selection=d3.select('.search-terms').selectAll('.wrapper-wrapper');
    console.log()
    search_term_selection=search_term_selection.data(terms.filter(a=>a.visible),(d)=>d.color)
        .join(
            enter=>{
                let wrapper_wrapper=enter.insert('span','button').attr('class','wrapper-wrapper');
                let wrapper=wrapper_wrapper.append('span').attr('class','gram-search-wrapper')
                
                // let inner_wrapper=wrapper.append('span').attr('class',)
                let width_setter=wrapper.append('span').attr('class','width-setter').text((d)=>d.gram)
                
                // <span class="gram-search-wrapper"><span class="width-setter">crime</span><input type="text" class="gram-search" data-index="0" value="crime" style="--rgb:133, 122, 255;"></span>

                wrapper
                    .append('input')
                    .attr('type','text')
                    .attr('class','gram-search')
                    .attr('data-old',(d)=>d.gram)
                    .attr('value',(d)=>d.gram)
                    .style('--rgb',(d)=>d.color)
                    .on('input',function(event,d){
                        //cases to handle in the future:
                            // more than 4 spaces (6+ gram)
                            // non-escaped sqlite command characters, e.g. ''
                        console.log(event,d)
                        
                        
                        width_setter.text(this.value);
                        d.gram=this.value;
                        
                        
                        clearTimeout(timer);
                        let input=d3.select(this);
                        timer=setTimeout(function(){
                            input.attr('data-old',d.gram)
                            if(d.gram.length>0) search();
                        },1000)
                    }).on('focusout',function(event,d){
                        let i=terms.indexOf(d);
                        if(!d.gram.length>0&&terms.filter(a=>a.visible).length>1){
                            console.log('remove')
                            d.visible=false;
                            // wrapper.remove();
                            update_search_entry();
                            let input=d3.select(this);
                            let response_ind=graph.data.findIndex((a)=>a.gram==input.attr('data-old'));
                            if(response_ind>-1) graph.data.splice(response_ind,1);
                            console.log(response_ind,d.gram)
                            graph.update();
                            d3.select('.add-more').classed('hide',false)
                        }
                    })
                
                // let width_setter=d3.select(this.parentNode).select('.width-setter');
                //         width_setter.text(this.value)
                
                return wrapper_wrapper;
            }
        )


}

function init(){
    graph = new Graph(d3.select('#graph'));
    
    d3.selectAll('.year-wrapper input')
        .on('input',function(){
            let sel=d3.select(this);
            let v=parseInt(this.value);

            if(v<this.min||v>this.max){
                sel.classed('invalid',true)
            }else{
                set_number(sel,v)
            }

        })
        .on('change',function(){
            let v=parseInt(this.value);
            if(v<this.min||v>this.max) this.value=this.dataset.val;
            set_number(d3.select(this),v)
        })

        function set_number(sel,v){
            sel.attr('value',v);
            let clamp_side=sel.attr('data-clamp')
            let other=d3.select(`.year-wrapper input[data-clamp=${clamp_side=='max'?'min':'max' }]`);
            if(clamp_side=='min'){
                other.attr('min',v+2)
            }else{
                other.attr('max',v-2)
            }

            clamp[clamp_side]=v;
            sel.classed('invalid',false);
            sel.attr('data-val',v);

            graph.update();
        }


    update_search_entry();

    d3.select('.search-terms .add-more').on('click',function(){
        let to_show=terms.filter(a=>!a.visible)[0]
        to_show.visible=true;
        update_search_entry();

        d3.selectAll('.gram-search-wrapper').filter((d)=>d.gram==to_show.gram).select('input').node().focus()
        // document.querySelector(`.search-terms input[value=""]`).focus();

        if(terms.filter(a=>!a.visible).length<1) d3.select(this).classed('hide',true)
    })

    search();
}









function search(){
    let query={
        terms:terms.filter(a=>a.gram.length>0).map(a=>a.gram)
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
            graph.update(plots);
        }
        
        // graph.update(json.terms);
    });
}



const Graph = class {
    constructor(svg,data){
        this.box=svg;
        this.data=data;
        this.dimensions={w:0,h:0}
        this.set_size();


        this.lines=this.box
            .append('g')
            .attr('class','paths')
            .selectAll('path');

        
       
        
        window.addEventListener('resize',this.set_size.bind(this));
    
    }

    set_size(){
        // console.log(d3.select('#graph-wrapper').node().getComputedStyle.width)
        this.dimensions.w=d3.select('#graph-wrapper').node().offsetWidth;
        this.dimensions.h=0.6*this.dimensions.w+20;
        this.box.attr('width',this.dimensions.w + 40);
        this.box.attr('height',this.dimensions.h);
        d3.select('#graph-wrapper').style('height',this.dimensions.h+'px')
        this.box.attr('viewBox',`-20 0 ${this.dimensions.w+30} ${this.dimensions.h}`)
        this.box.select('#x-axis').attr('transform',`translate(0,${this.dimensions.h-20})`)
        if(this.data) this.update();
    }

    update(data=this.data){

        this.data=data;
        console.log('parsed:',data)
        
        let filtered=data.map(term=>{
            return {
                gram:term.gram,
                plot:term.plot.filter(entry=>{return entry.x.getFullYear()>=clamp.min&&entry.x.getFullYear()<=clamp.max})
            }
        })
        let flattened=[];
        for(let term of filtered) flattened=flattened.concat(term.plot);


        //for x labels:
        // - if less than a certain amount, show all
        // - if 


        // let x_scale=d3.scaleTime()
        //     .domain(d3.extent(flattened,(d)=>d.x))
        //     .range([0,100])

        let x_scale=d3.scaleTime()
            .domain([parse_date(`${clamp.min}_01`),parse_date(`${clamp.max}_12`)])
            .range([0,this.dimensions.w + 20])
            
        

        let y_scale=d3.scaleLinear()
            .domain([0,d3.max(flattened,(d)=>d.y)])
            .range([this.dimensions.h - 20,10]);
        
        let x_axis=d3.axisBottom(x_scale)
        let y_axis=d3.axisLeft(y_scale)

            // .append('g').attr('transform',`translate(0,${this.dimensions.h-20})`)
            // .append('g').attr('transform','translate(0,0)')
        this.box.select('#x-axis').call(x_axis);
        this.box.select('#y-axis').call(y_axis);

        let line_generator = d3.line()
            .x((d)=>x_scale(d.x))
            .y((d)=>y_scale(d.y))
            .curve(d3.curveLinear)
            .defined(d => d.y !== null) 
        


        this.lines=this.lines.data(filtered,d=>d.gram)
            .join(
                enter=>enter
                    .append('path')
                    .attr('data-gram',d=>d.gram)
                    .attr('vector-effect','non-scaling-stroke')
                    .style('stroke',(d,i)=>`rgb(${terms[i].color})`)
                    // .attr('marker-mid','url(#dot)')
                    .attr('d',d=>line_generator(d.plot)),
                update=>update
                    .attr('d',d=>line_generator(d.plot))
            )
    }
}


function process_data(response){
    
    let plots=[];
    for(let term of response){
        let plot=[];
        let keys=Object.keys(term);
        for(let key of keys){
            
            if(key!=='gram'){
                let ym=key.replace('m','');
                plot.push({
                    x:parse_date(ym),
                    y:term[key]?term[key]:0
                })
            }
            
        }

        console.log(plot)
        for(let y=1975; y<=2000;y++){
            for(let m=1; m<=12;m++){
                let d=parse_date(`${y}_${m<10?0:''}${m}`);
                let date_exists=plot.some(a=>a.x.valueOf()==d.valueOf());
                if(!date_exists) plot.push({
                    x:d,
                    y:null
                })
            }
        }

        plot=plot.sort((a,b)=>{
            return a.x.getTime() - b.x.getTime()
        })

        plots.push({
            gram:term.gram,
            plot:plot
        })
    }
    

    return plots;
}