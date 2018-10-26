var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var request = require('request');
Data_Score = {};
Data_Rank = [];
Data_Submission = [];
Data_Userlist = [];
Data_History = [];
Data_SubmissionAll = [];
Initing = 1;
var Config = {};
Config.begintime = 1527679500;
Config.endtime = 1527679800;
Config.cmsrankurl = 'http://cms.tfcis.org/rank123456/';

app.use('/source',express.static(__dirname + '/source'));
app.get('/', function(req, res){
	res.sendFile(__dirname + '/livescore.html');
});

function getunixtime(){
    var date = new Date();
    var time = parseInt(date/1000);
    return time;
}

function makedata(){
    var dataset = []; 
    var Num = 0,tnum=0;
    for (var i=0; i < 50; i++){
        var newNum = Num + (Math.floor(Math.random() * 10));
        dataset.push({x: tnum,y: Num});
        dataset.push({x: tnum,y: newNum});
        tnum+=5;
        Num = newNum;
    }
    var name = Math.random().toString(36);
    return {dataset: dataset,name: name};
}

function scoreupdate(){
    console.log(getunixtime()+" score update");
    request({uri: Config.cmsrankurl+'scores',
    headers: {'Accept': 'application/json'},method: "GET"},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body),data = {};
            var HisNeedUpdate = 0;
            for(var tid in info){
                var name = tid,score=0;
                for(var pid in info[tid]){
                    score+=parseInt(info[tid][pid]);
                }
                if(!Data_Score.hasOwnProperty(name) || score>Data_Score[name])HisNeedUpdate = 1;
                data[name] = score;
            }
            Data_Score = data;
            sort_score();
            //console.log(Data_Score);
            //console.log(Data_Rank);
            if(HisNeedUpdate==1)historyupdate();
            else{
                setTimeout(scoreupdate,3000);
            }
        }
    });
}

function userinit(){
    console.log(getunixtime()+" user init");
    request({uri: Config.cmsrankurl+'users/',
    headers: {'Accept': 'application/json'},method: "GET"},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body),data = {};
            for(var tid in info){
                var name = info[tid]["f_name"];
                data[tid] = name;
            }
            Data_Userlist = data;
            setTimeout(userinit,10000);
        }
    });
}

function historyupdate(){
    console.log(getunixtime()+" history update")
    request({uri: Config.cmsrankurl+'history',
    headers: {'Accept': 'application/json'},method: "GET"},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            Data_Submission = info;
            calc_his();
            io.emit("update",{data: Data_History,userlist: Data_Userlist,rank: Data_Rank});
            if(Initing==0)setTimeout(scoreupdate,3000);
            Initing = 0;
        }
    });
}

function calc_his(){
    var nowsc = {},his = {};
    for(var i=0;i<Data_Submission.length;i++){
        var sub = Data_Submission[i];
        if(!nowsc.hasOwnProperty(sub[0])){
            nowsc[sub[0]]={};
            nowsc[sub[0]]['total'] = 0;
        }
        //console.log(nowsc[sub[0]]);
        if(nowsc[sub[0]].hasOwnProperty(sub[1])){
            if(nowsc[sub[0]][sub[1]]<parseInt(sub[3])){
                nowsc[sub[0]]['total'] += parseInt(sub[3])-nowsc[sub[0]][sub[1]];
                nowsc[sub[0]][sub[1]] = parseInt(sub[3]);
                if(!his.hasOwnProperty(sub[0]))his[sub[0]] = [];
                his[sub[0]].push({time: sub[2]-Config.begintime,score: nowsc[sub[0]]['total'],pro: sub[1],sc: sub[3]});
            }
        }
        else if(parseInt(sub[3])!=0){
            nowsc[sub[0]][sub[1]] = parseInt(sub[3]);
            nowsc[sub[0]]['total'] += parseInt(sub[3]);
            if(!his.hasOwnProperty(sub[0]))his[sub[0]] = [];
            his[sub[0]].push({time: sub[2]-Config.begintime,score: nowsc[sub[0]]['total'],pro: sub[1],sc: sub[3]});
        }
    }
    //console.log(his);
    Data_History = his;
}

function sort_score(){
    Data_Rank = [];
    for(var us in Data_Score){
        Data_Rank.push({name: us,score: Data_Score[us]});
    }
    Data_Rank.sort(function(da,db){
        return db.score-da.score;
    });
    //console.log(Data_Rank);
}

function updatesubmission(){
    console.log(getunixtime()+" submission update")
    request({uri: Config.cmsrankurl+'submissions/',
    headers: {'Accept': 'application/json'},method: "GET"},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var info = JSON.parse(body);
            Data_SubmissionAll = [];
            for(var sid in info){
                var sobj = info[sid];
                sobj['sid'] = sid;
                sobj['time'] -= Config.begintime;
                Data_SubmissionAll.push(sobj);
            }
            Data_SubmissionAll.sort(function(a,b){
                return a.sid-b.sid;
            });
            //console.log(Data_SubmissionAll);
            io.emit('NewSubmit',Data_SubmissionAll);
            setTimeout(updatesubmission,3000);
        }
    });
}

function getdata(){
    var dataset=[];
    for(i=0;i<10;i++){
        var ds = makedata();
        dataset[i] = ds;
    }
    return dataset;
}

io.on('connection', function(socket){
    socket.on('getTime',function(msg){
        console.log(getunixtime()+' getTime');
        var ut=getunixtime();
        io.emit('getTime',{time: ut});
    });
    socket.on('init',function(msg){
        console.log(getunixtime()+" client init");
        var dataset = Data_History;
        io.emit("init",{data: dataset,userlist: Data_Userlist,rank: Data_Rank,submission: Data_SubmissionAll});
    });
});
scoreupdate();
historyupdate();
userinit();
updatesubmission();

//setInterval(scoreupdate,1000);

http.listen(8001);