console.log('hi')




let timer;

let dom_loaded=false;
let publications=[
    {name:'All publications',key:'all_publications',checked:true,type:'general'},
    {name:'All print',key:'all_print',checked:false,type:'general',match:'print'},
    {name:'All radio',key:'all_radio',checked:false,type:'general',match:'radio'}
];
let publications_set_up=false;


let terms=[
    {gram:'youth',color:'255, 0, 245',visible:true,plot:[]},
    {gram:'',color:"0, 255, 224",visible:false,plot:[]},
    {gram:'',color:'102, 73, 73',visible:false,plot:[]},
    {gram:'',color:'67, 150, 66',visible:false,plot:[]},
    {gram:'',color:'254, 198, 0',visible:false,plot:[]}
];

async function get_publist() {
    const response = await fetch("data/publications.json");
    const data = await response.json();
    data.publications.map(a=>{
        a.checked=false;
        a.type=a.type||'print';
    })
    publications=publications.concat(data.publications);
    if(dom_loaded&&!publications_set_up) set_up_publication_dropdown();
}

get_publist();



let graph;

let clamp={
    min:1975,
    max:2000
}

const parse_date=d3.timeParse("%Y_%m");
let search_term_selection=d3.select('.search-terms').selectAll('.gram-search');
let dropdown_items=d3.select('#publication-dropdown ul').selectAll('li');

window.addEventListener('load',init)


function update_search_entry(){
    d3.select('.search-terms').attr('data-count',terms.filter(a=>a.visible).length)
    let search_term_selection=d3.select('.search-terms').selectAll('.wrapper-wrapper');

    search_term_selection=search_term_selection.data(terms.filter(a=>a.visible),(d)=>d.gram+d.color)
        .join(
            enter=>{
                let wrapper_wrapper=enter.insert('span','button').attr('class','wrapper-wrapper');
                let wrapper=wrapper_wrapper.append('span').attr('class','gram-search-wrapper')
                

                let width_setter=wrapper.append('span').attr('class','width-setter').text((d)=>d.gram)
                
     
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
                            d.visible=false;
                            // wrapper.remove();
                            update_search_entry();
                            let input=d3.select(this);
                            let response_ind=graph.data.findIndex((a)=>a.gram==input.attr('data-old'));
                            if(response_ind>-1) graph.data.splice(response_ind,1);
                            graph.update();
                            d3.select('.add-more').classed('hide',false)
                        }
                    })
                
       
                
                return wrapper_wrapper;
            }
        )


}

function init(){
    dom_loaded=true;
    

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

    d3.selectAll('button.to-page')
    .on('click',function(){
        event.preventDefault()
        d3.select('.current').classed('current',false)

        d3.select(event.currentTarget.dataset.href).classed('current',true)
       
    })

    if(publications.length>3&&!publications_set_up) set_up_publication_dropdown();
    
    search();

    

}


function set_up_publication_dropdown(){
    publications_set_up=true;

    let dropdown=document.querySelector('#publication-dropdown');
    let dropdown_search=d3.select('#publication-dropdown input[type="text"]');


    // publications

    let selected_summary='';

    // publications=generalizations.concat(publications);
    let visible_publications=publications;
    console.log(publications)
    update_dropdown();

    
    function update_dropdown(){
        let selected=publications.filter(a=>a.checked).map(a=>a.type=='general'?a.name.toLowerCase():a.name);
        console.log(selected);
        // let find_all_pubs=selected.findIndex(a=>a=="all publications")
        
        // if(selected.length>1&&find_all_pubs>=0){
        //     selected.splice(find_all_pubs,1);
        // }
        console.log(selected.length)
        if(selected.length>1) selected[selected.length - 1]='and '+selected[selected.length - 1];
        selected_summary=selected.join(selected.length>2?', ':' ');
        if(selected.find(a=>a=='all publications')) selected_summary='all publications';
        
        d3.select('#publication-dropdown summary').text(selected_summary);

        dropdown_items=dropdown_items.data(visible_publications,(d)=>d.key)
        .join(enter=>{
            let li=enter.append('li')
                .attr('data-selected',d=>d.checked);
            let checkbox=li.append('input').attr("type", "checkbox").property('checked',d=>d.checked)
            let label=li.append('label').text(d=>d.name);
            checkbox.on('change',function(){
                let data=d3.select(this).data()[0];
                // if(publications.find(a=>a.key=='all_publications').checked&&)
                if(!(visible_publications.filter(a=>a.checked).length<2&&data.checked)){
                    data.checked=this.checked
                    update_dropdown();
                    search();
                };
                
                
            })
            return li;
        },update=>{
            update
                .attr('data-selected',d=>d.checked);
            return update;
        })
    }

    dropdown_search.on('input',function(){
   
        let str=this.value.toLowerCase();
        visible_publications=publications.filter(a=>{
            return a.checked||a.name.toLowerCase().includes(str)
        });
        
        update_dropdown();
        
    })
}








function search(){
    console.log(publications)
    let query={
        terms:terms.filter(a=>a.gram.length>0).map(a=>a.gram),
        publications:publications.filter(a=>a.checked)
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
   
        this.dimensions.w=d3.select('#graph-wrapper').node().offsetWidth;
        this.dimensions.h=0.6*this.dimensions.w+20;
        this.box.attr('width',this.dimensions.w + 40);
        this.box.attr('height',this.dimensions.h);

     

        d3.select('#graph-wrapper').style('height',this.dimensions.h+'px')
        
        this.box.attr('viewBox',`-40 0 ${this.dimensions.w+60} ${this.dimensions.h}`)
        this.box.select('#x-axis').attr('transform',`translate(0,${this.dimensions.h-20})`)
        if(this.data) this.update();
    }

    update(data=this.data){

        this.data=data;
        console.log('parsed:',data)
        
        //filters by visibility and year range
        let filtered=data.filter(a=>a.visible).map(term=>{
            return {
                gram:term.gram,
                color:term.color,
                plot:term.plot.filter(entry=>{return entry.x.getFullYear()>=clamp.min&&entry.x.getFullYear()<=clamp.max})
            }
        })
        let flattened=[];
        for(let term of filtered) flattened=flattened.concat(term.plot);


        //for x labels:
        // - if less than a certain amount, show all
        // - if 



        let x_scale=d3.scaleTime()
            .domain([parse_date(`${clamp.min}_01`),parse_date(`${clamp.max}_12`)])
            .range([0,this.dimensions.w + 20])
            
        

        let y_scale=d3.scaleLinear()
            .domain([0,d3.max(flattened,(d)=>d.y)])
            .range([this.dimensions.h - 20,10]);
        
        let x_axis=d3.axisBottom(x_scale)
        let y_axis=d3.axisLeft(y_scale)

        let x_axis_years=d3.axisBottom(x_scale)
            .ticks(d3.timeYear.every(1))
            .tickSize(this.dimensions.h - 20)

            // .append('g').attr('transform',`translate(0,${this.dimensions.h-20})`)
            // .append('g').attr('transform','translate(0,0)')
        this.box.select('#x-axis-years').call(x_axis_years);
        this.box.select('#x-axis').call(x_axis);
        this.box.select('#y-axis').call(y_axis);
        

        let line_generator = d3.line()
            .x((d)=>x_scale(d.x))
            .y((d)=>y_scale(d.y))
            .curve(d3.curveLinear)
            .defined(d => d.y !== null)
        

        this.lines=this.lines.data(filtered,d=>d.gram+'-'+d.color)
            .join(
                enter=>enter
                    .append('path')
                    .attr('data-gram',d=>d.gram)
                    .attr('vector-effect','non-scaling-stroke')
                    .style('stroke',(d,i)=>`rgb(${d.color})`)
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