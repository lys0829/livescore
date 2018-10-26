var socket = io.connect();
Data_SubmissionShowed = {};
Data_Userlist = [];
Data_NowGraph = {};

function ShowSubmission(sl){
    //console.log(d);
    for(var sub in sl){
        d = sl[sub];
        if(!Data_SubmissionShowed.hasOwnProperty(d.sid)){
            Data_SubmissionShowed[d.sid] = 1;
            ShowMessage(sec2time(d.time),"Submission "+d.sid+" -- "+Data_Userlist[d.user]+" submit "+d.task);
        }
    }
}

socket.emit("init","");
socket.on("init",function(d){
    console.log("init");
    Data_Userlist = d.userlist;
    //console.log(Data_Userlist);
    Data_NowGraph=d;
    DrawNewGraph(d);
    ShowSubmission(d.submission);
});
socket.on("update",function(d){
    console.log("update graph");
    Data_NowGraph=d;
});
var nowunixtime=0,needgettime=0,timelength=0;
timelength = Config.endtime-Config.begintime;
socket.emit("getTime","");
setInterval(function(){
    if(needgettime<=0){
        socket.emit("getTime","");
        console.log("getTime");
        needgettime=30;
        return ;
    }
    nowunixtime+=1;
    needgettime-=1;
},1000);
socket.on("getTime",function(data){
    nowunixtime=data.time;
});
setInterval(function(){DrawNewGraph(Data_NowGraph);},1000);
setInterval(function(){
    var time=nowunixtime,colorpercent,rednum,greennum;
    if(time<Config.begintime){
        time=Config.endtime-Config.begintime;
        NowContestTime=0;
    }
    if(time>Config.endtime){
        time=0;
        NowContestTime=Config.endtime-Config.begintime;
    }
    if(time>=Config.begintime && time<=Config.endtime){
        NowContestTime=time-Config.begintime;
        time = Config.endtime-time;
    }
    colorpercent = Math.floor(511*(1-(time/timelength)));
    if(colorpercent<256){
        greennum = 255;
        rednum = colorpercent;
    }
    else{
        rednum = 255;
        greennum = 255-(colorpercent-256);
    }
    $("#timer").html(sec2time(time));
    $("#timer").css("color","rgba("+rednum+","+greennum+",0,1)");
},1000);

/*setInterval(function(){
    var time=nowunixtime;
    time = time-Config.begintime;
    ShowMessage(sec2time(time),"Submission 888 -- Team01 submit A_abyss");
},1000);*/

socket.on("NewSubmit",function(d){
    ShowSubmission(d);
});