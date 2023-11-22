const express = require("express");
const app= express()
const port= 4003;


app.use(express.static("public"));

app.get('/',function(req,res){
    res.sendFile(__dirname+"/main.html");
})
app.get('/main.html',function(req,res){
    res.sendFile(__dirname+"/main.html");
})
app.get('/login.html',function(req,res){
    res.sendFile(__dirname+"/login.html");
})
app.get('/photos.html',function(req,res){
    res.sendFile(__dirname+"/photos.html");
})
app.get('/membership.html',function(req,res){
    res.sendFile(__dirname+"/membership.html");
})
app.get('/search.html',function(req,res){
    res.sendFile(__dirname+"/search.html");
})
app.get('/mypictures.html',function(req,res){
    res.sendFile(__dirname+"/mypictures.html");
})
app.get('/scrap.html',function(req,res){
    res.sendFile(__dirname+"/scrap.html");
})
app.get('/photoupload.html',function(req,res){
    res.sendFile(__dirname+"/photoupload.html");
})


app.listen(port, function(err){
    if(err) return console.log(err);
    
    console.log(`open server listen on port:${port}`);
})