import * as d3 from 'd3';

const parse_date=d3.timeParse("%Y-%m");


export const Graph = class {
    constructor(svg,data,clamp){
        this.box=svg;
        this.data=data;
        this.dimensions={w:0,h:0}
        this.set_size();
        this.clamp=clamp
        // clamp={
        //     start:1975,
        //     end:2000
        // }


        this.lines=this.box
            .append('g')
            .attr('class','paths')
            .selectAll('path');

        
       
        
        window.addEventListener('resize',this.set_size.bind(this));
    
    }

    set_size(){
   
        this.dimensions.w=d3.select('#graph-wrapper').node().offsetWidth;
        this.dimensions.h=0.6*this.dimensions.w+20;
        this.box.attr('width',this.dimensions.w + 85);
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
        let filtered=data?.filter(a=>a.visible).map(term=>{
            return {
                gram:term.gram,
                color:term.color,
                plot:(term.plot || []).filter(entry=>{return entry.x.getFullYear()>=this.clamp.start&&entry.x.getFullYear()<=this.clamp.end})
            }
        }) || []
        let flattened=[];
        for(let term of filtered) flattened=flattened.concat(term.plot);



        let x_scale=d3.scaleTime()
            .domain([parse_date(`${this.clamp.start}-01`),parse_date(`${this.clamp.end}-12`)])
            .range([0,this.dimensions.w + 20])
            
        

        let y_scale=d3.scaleLinear()
            .domain([0,d3.max(flattened,(d)=>d.y)])
            .range([this.dimensions.h - 20,10]);

        const formatPercent = d3.format(".3~%")
        
        let x_axis=d3.axisBottom(x_scale)
        let y_axis=d3.axisLeft(y_scale).tickFormat(formatPercent);

        

        let x_axis_years=d3.axisBottom(x_scale)
            .ticks(d3.timeYear.every(1))
            .tickSize(this.dimensions.h - 20)

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

export function process_data(response){
    
    let plots=[];
    for(let term of response){
        let plot=term.data.map(datapt=>{
            return {
                x:parse_date(datapt.month),
                y:datapt.val
            }
        });

        for(let y=1975; y<=2000;y++){
            for(let m=1; m<=12;m++){
                let d=parse_date(`${y}-${m<10?0:''}${m}`);
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
            plot
        })
    }
    
    return plots;
}