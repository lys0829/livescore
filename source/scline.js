NowContestTime = Config.endtime-Config.begintime;
var sec2time=function(time){
    var h,m,s;
    h = parseInt(time/3600);
    m = parseInt(time/60)%60;
    s = time%60;
    var showtime;
    showtime = paddingLeft(h.toString(),2)+":"+paddingLeft(m.toString(),2)+":"+paddingLeft(s.toString(),2);
    return showtime;
};

function paddingLeft(str,lenght){
	if(str.length >= lenght)
	return str;
	else
	return paddingLeft("0" +str,lenght);
}

function ShowMessage(time, msg, style) {
    var div = $("#announce");
    var text = $("<div>[" + time + "] " + msg + "</div>");
    if ( style )
        text.addClass(style);

    text.fadeIn("slow");
    div.append(text);

    // Scroll to last line atfer add the message
    div[0].scrollTop = div[0].scrollHeight;
}

function DrawNewGraph(d){
    console.log(NowContestTime);
    d3.selectAll("svg").remove();
    var margin = {top: 10, right: 10, bottom: 50, left: 30};
    var w = 1300 ; // 寬
    var h = 450 ; // 高
    var d3color = d3.scaleOrdinal(d3.schemeCategory10);
    //var d3color = d3.scaleLinear().domain([1, 100]).range(['#007aff', '#fff500']);
    var LiveScoreGraph = new Graph({margin: margin,w: w,h: h,hs: 500,tl: Config.endtime-Config.begintime});
    var alldata = d.data,allline={}
    var userlist=d.userlist
    var legendlist = [];
    var ranklist = d.rank;
    //console.log(LiveScoreGraph.svg);
    console.log(ranklist);
    var users=10;
    for(var rid in ranklist){
        uid = ranklist[rid].name;
        if(users<=0)break;
        users-=1;
        //console.log(uid);
        var data = [];
        data.push({x: alldata[uid][0]['time'],y: 0});
        for(var i=0;i<alldata[uid].length;i++){
            if(i!=0)data.push({x: alldata[uid][i]['time'],y: alldata[uid][i-1]['score']});
            data.push({x: alldata[uid][i]['time'],y: alldata[uid][i]['score']});
        }
        data.push({x: NowContestTime,y: alldata[uid][alldata[uid].length-1]['score']});
        allline[uid] = new Scline({dataset: data,name: userlist[uid],color: d3color(users+1),graph: LiveScoreGraph});
        legendlist[9-users] = allline[uid];
        allline[uid].draw();
    }
    // add legend   
	var legend = LiveScoreGraph.svg.append("g")
        .attr("class", "legend")
        .attr("height", 100)
        .attr("width", 100)
        .attr('transform', 'translate(-20,50)');
    console.log(legendlist);
    legend.selectAll('rect')
        .data(legendlist)
        .enter()
        .append("rect")
        .attr("x", w - 60)
        .attr("y", function(d, i){ return i *  25;})
        .attr("width", 10)
        .attr("height", 10)
        .style("fill", function(d) { 
            return d.color;
        });
      
    legend.selectAll('text')
        .data(legendlist)
        .enter()
        .append("text")
        .attr("x", w - 47)
        .attr("y", function(d, i){ return i *  25 + 12;})
        .text(function(d) {
            return d.name;
        });
}

var Graph=function(init){
    var margin,w,h,svg,hiscore,timelength;
    margin = init.margin;
    w=init.w;
    h=init.h;
    hiscore = init.hs;
    timelength = init.tl;
    var Ymax = hiscore,Ymin = 0,
        Xmax = timelength,Xmin = 0;
    var xScale = d3.scaleLinear().domain([Xmin, Xmax]).range([0, w-100]);
    var yScale = d3.scaleLinear().domain([Ymin, Ymax]).range([h, 0]);
    this.data2line = d3.line()
        .x(function(d,i) {
            return xScale(d.x); //利用尺度運算資料索引，傳回x的位置
        })
        .y(function(d) {
            return yScale(d.y); //利用尺度運算資料的值，傳回y的位置
        });
    svg = d3.select('#graph').append('svg')
        .attr('width', w + margin.left + margin.right) //將左右補滿
        .attr('height', h + margin.top + margin.bottom) //上下補滿
        .append('g') //增加一個群組g
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    // 增加x軸線，tickSize是軸線的垂直高度，-h會往上拉高
    // tickSubdivide不清楚是什麼用處
    var tickval = [];
    for(var i=1200;i<=Xmax;i+=1200)tickval.push(i);
    var xAxis = d3.axisBottom(xScale).tickValues(tickval).tickFormat(function(d){return sec2time(d);});
    // SVG加入x軸線
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + h + ')')
        .call(xAxis);
    // 建立y軸線，4個刻度，數字在左
    var yAxisLeft = d3.axisLeft(yScale);
    // SVG加入y軸線
    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(0,0)')
        .call(yAxisLeft);
    
    this.svg=svg;
};

var Scline=function(data){
    this.color = data.color;
    this.name = data.name;
    var dataset;
    var graph;
    dataset = data.dataset;
    graph = data.graph;
    //console.log(color);

    this.draw = function(){
        //console.log(dataset);
        //console.log(graph);
        graph.svg.append('path')
            .attr('d', graph.data2line(dataset))
            .attr('stroke', this.color);
    };
};