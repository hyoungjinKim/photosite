const express=require('express')
const mysql= require('mysql2')
const path = require('path')
const static = require('serve-static')
const expressSession=require('express-session')
const cookieParser=require('cookie-parser')
//db 정보 받아옴
const dbconfig = require(`./config/dbconfig.json`)

//서버 생성
const app= express()
//포트 번호
const port= 4003;

//받아온 데이터 변환
app.use(express.urlencoded({ extended: false }));
app.use(express.json())

//public폴더를 최상위 폴더로 바꿈
app.use(express.static("router"));
app.use('/', static(path.join(__dirname,`public`)));
app.use(cookieParser());
app.use(
    expressSession({
      secret: "my key",
      name:'uniqueSessionId',
      resave: true,
      saveUninitialized: true,
    })
);

//db pool로 생성
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

//회원가입
app.post('/process/adduser', async(req,res)=>{
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

app.post('/process/login' , async(req,res)=>{
    console.log('process/login req'+req);
    const paramid = req.body.id;
    const parampassword = req.body.password;
    console.log(`로그인 요청${paramid, parampassword}`);

    await pool.getConnection((err,con)=>{
        con.release();
        if(err){
            console.log('sql run err');
            console.dir(err);
            res.writeHead('500',{'Content-Type':'text/html; charset=utf8'})
            res.write('<h2>sql quary 실행 실패</h2>')
            res.end();
            return;
        }
        const exec = con.query("select `id`, `pw` from `user` where `id`=? and `pw`= SHA2(?,256);",
            [paramid,parampassword],
            (err,rows)=>{
                con.release();
                console.log('실행된 sql quary:'+exec.sql);
                
                if(err){
                    console.log('sql run err');
                    console.dir(err);
                    res.writeHead('500',{'Content-Type':'text/html; charset=utf8'})
                    res.redirect('/main.html')
                    res.end();
                    return;
                }

                if(rows.length>0){
                    console.log(`아이디[${paramid}]찾음`);
                    if (req.session.users) {
                        // 세션에 유저가 존재한다면
                        console.log("이미 로그인 돼있습니다~");
                        res.status(200).redirect('/main.html')
                        res.end();
                      } else {
                        req.session.users = {
                          id: paramid,
                          pw: parampassword,
                          authorized: true,
                        };
                        res.status(200).redirect('/main.html')
                        res.end();
                      };                   
                    res.end();
                    return;
                }
                else{
                    console.log(`아이디와 패스워드 일치 안함`);
                    res.writeHead('500',{'Content-Type':'text/html; charset=utf8'})
                    res.write('<h2>login faile</h2>')
                    res.end();
                    return;
                }
            }
        )
    })
})







app.listen(port, function(err){
    if(err) return console.log(err);
    console.log(`open server listen on port:${port}`);
})