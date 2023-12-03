const express=require('express')
const mysql= require('mysql2')
const path = require('path')
const static = require('serve-static')
const app= express()

const dbconfig = require(`./config/dbconfig.json`)

app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static("public"));
app.use('/', static(path.join(__dirname,`public`)));


const port= 4003;

const pool = mysql.createPool({
    connectionLimit: 10,
    host:dbconfig.host,
    port: dbconfig.port,
    user:dbconfig.user,
    password: dbconfig.password,
    database: dbconfig.database,
    debug:false
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.post('/adduser', async(req,res)=>{
    console.log(`/adduser 호출됨${req}`);

    const paramid=req.body.id;
    const parampassword=req.body.password;
    const paramnickname=req.body.nickname;
    try{
        const con = await pool.promise().getConnection();

        console.log('connect db');
        const result =await con.query('INSERT INTO user (id, pw, nickname) VALUES (?, SHA2(?,256), ?);',
        [paramid,parampassword,paramnickname]);
    con.release();

    console.dir(result);
    console.log('insert success');
    res.redirect('/login.html');
    } catch(err){
        console.error('sql run err');
        console.error(err);
        res.status(500).send('<h2>SQL query 실행 실패</h2>');
        res.end();
    }
})


app.listen(port, function(err){
    if(err) return console.log(err);
    console.log(`open server listen on port:${port}`);
})