const express=require('express');
const mysql= require('mysql2');
const path = require('path');
const static = require('serve-static');
const expressSession=require('express-session');
const cookie=require('cookie-parser');
const fs = require('fs');
const multer = require('multer');

const app= express();

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs'); //view engine이 사용할 Template Engine

const storage=multer.diskStorage({
  destination: function(req,file,cd){
    cd(null,"./public/images/");
  },
  filename: function(req,file,cd){
    const ext=path.extname(file.originalname);
    cd(null, path.basename(file.originalname,ext)+"-"+Date.now()+ext);
  },
});

const upload=multer({ storage : storage});

//db 정보 받아옴
const dbconfig = require(`./config/dbconfig.json`);
//session 정보
const session =require(`./config/session.json`);

//포트 번호
const port= 4003;

//받아온 데이터 변환
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//public폴더를 최상위 폴더로 바꿈
app.use(static(path.join(__dirname,`/public`)));
app.use(cookie());

//express-session
app.use(
    expressSession({
      secret: session.key,//암호화에 사용될 키
      name: session.name,//session 이름
      resave: false,//세션을 언제나 저장할지 설정
      saveUninitialized: false,//세션에 저장할 내역이 없더라도 처음부터 세션을 생성할지 설정
      cookie : {//세션 쿠키 설정
                httpOnly: true//js로 세션 쿠키를 사용할수 없도록 함
    }})
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

const setHeaderData = (req, res, next) => {
  // 사용자가 로그인한 경우
  if (req.session.users && req.session.users.Logined) {
    res.locals.name = req.session.users.name;
  } else {
    // 로그인하지 않은 경우
    res.locals.name = '';
  }
  next();
};

app.use(setHeaderData);

//index페이지
app.get('/', async(req, res) => {
  await pool.getConnection((err,con)=>{
    if(err){
      console.log('sql run err');
      console.dir(err);
      res.status('500').redirect('/main.ejs');
      res.end();
    }else{
      con.query("select * from photo.photo;",
      (err,rows)=>{
        con.release();
        if(err){
          console.log('sql run err');
          console.dir(err);
          res.status(500).redirect('/main.ejs');
          res.end();
          return;
        }
        res.render("main.ejs",{
          photo: rows
        })
      })
    }
  })
});

//login페이지
app.get('/login.ejs', (req, res) => {
  res.render("login.ejs");
});

//회원가입페이지
app.get('/membership.ejs', (req, res) => {
  res.render("membership.ejs");
});

//loginerr페이지
app.get('/loginerr.ejs', (req, res) => {
  res.render("loginerr.ejs");
});

//스크랩페이지
app.get('/scrap.ejs', (req, res) => {
  res.render("scrap.ejs");
});

//검색페이지
app.get('/search.ejs', (req, res) => {
  res.render("search.ejs");
});

//사진 페이지
app.get('/photos.ejs', async (req, res) => {
  await pool.getConnection((err,con)=>{
    if(err){
        console.log('sql run err');
        console.dir(err);
        res.status('500').redirect('/main.ejs');
        res.end();
    }
    con.query("select * from photo.photo;",
        (err,rows)=>{
            con.release();
            if(err){
                console.log('sql run err');
                console.dir(err);
                res.status(500).redirect('/main.ejs');
                res.end();
                return;
            }
            if (rows.length > 0) {
              res.render("photos.ejs", {
                title: `${rows[0].title}`,
                comment: `${rows[0].comment}`
              });
              con.release();
            }
          }
        )
    })
});

//내가 업로드한 사진
app.get('/mypictures.ejs', async (req, res) => {
  if (req.session.users) {
    await pool.getConnection((err, con) => {
      if (err) {
        console.log('sql run err');
        console.dir(err);
        res.status(500).redirect('/main.ejs');
        res.end();
      }
      con.query(`select * from photo.photo where user_id=?;`,
        [req.session.users.id],
        (err, rows) => {
          con.release();
          if (err) {
            console.log('sql run err');
            console.dir(err);
            res.status(500).redirect('/main.ejs');
            res.end();
            return;
          }
          res.render("mypictures.ejs", {
            photo: rows,
          });
        }
      );
    });
  } else {
    console.log(`로그인하세요`);
    res.redirect('/login.ejs');
  }
});


//index페이지
app.get('/main.ejs', async(req, res) => {
  await pool.getConnection((err,con)=>{
    if(err){
      console.log('sql run err');
      console.dir(err);
      res.status('500').redirect('/main.ejs');
      res.end();
    }else{
      con.query("select * from photo.photo;",
      (err,rows)=>{
        con.release();
        if(err){
          console.log('sql run err');
          console.dir(err);
          res.status(500).redirect('/main.ejs');
          res.end();
          return;
        }
        res.render("main.ejs",{
          photo: rows
        })
      })
    }
  })
});

//사진 업로드
app.get('/photoupload.ejs', (req, res) => {
  res.render("photoupload.ejs",{
    formal:'0'
  });
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
        await con.query('INSERT INTO user (id, pw, nickname) VALUES (?, SHA2(?,256), ?);',
        [paramid,parampassword,paramnickname]);
    con.release();

    console.log('insert success');
    res.redirect('/login.ejs');
    } catch(err){
        console.error('sql run err');
        console.error(err);
        res.status(500).send('<h2>SQL query 실행 실패</h2>');
        res.end();
    }
})

//login
app.post('/login' , async(req,res)=>{
    console.log('process/login req'+req);
    const paramid = req.body.id;
    const parampassword = req.body.password;
    console.log(`로그인 요청${paramid, parampassword}`);

    await pool.getConnection((err,con)=>{
        con.release();
        if(err){
            console.log('sql run err');
            console.dir(err);
            res.status('500').send('<h2>sql quary 실행 실패</h2>');
            res.end();
            return;
        }
        con.query("select * from photo.user where id=? and pw= SHA2(?,256);",
            [paramid,parampassword],
            (err,rows)=>{
                con.release();
                
                if(err){
                    console.log('sql run err');
                    console.dir(err);
                    res.status(500).redirect('/main.ejs');
                    res.end();
                    return;
                }

                if(rows.length>0){
                    console.log(`아이디[${paramid}]찾음`);
                    if (req.session.users) {
                        // 세션에 유저가 존재한다면
                        if(req.session.users.name != rows[0].nickname)
                        {
                            req.session.destroy((err) => {
                                if (err) {
                                  console.log("세션 삭제시에 에러가 발생했습니다.");
                                  res.writeHead('500').write(`<h2>session delete err</h2>`);
                                  return;
                                }
                                console.log("세션이 삭제됐습니다.");
                                res.redirect("/login.ejs");
                              });
                        }
                        console.log("이미 로그인 돼있습니다~");
                        res.status(200).redirect('/main.ejs');
                        res.end();
                      } else {
                        req.session.users = {
                          id:paramid,
                          Logined: true,
                          name :rows[0].nickname,
                          authorized: true,
                        };
                        console.log(req.session.users.name);
                        res.status(200).redirect('/main.ejs');
                        res.end();
                      };                   
                    res.end();
                    return;
                }
                else{
                    if(req.session.users){
                        req.session.destroy((err) => {
                        if (err) {
                          console.log("세션 삭제시에 에러가 발생했습니다.");
                          return;
                        }
                        console.log("세션이 삭제됐습니다.1");
                      });
                    }   
                    console.log(`아이디와 패스워드 일치 안함`);
                    res.status(500).redirect('/loginerr.ejs');
                    res.end();
                    return;
                }
            }
        )
    })
})

//logout
app.get("/logout", (req, res) => {
    console.log("로그아웃");
    console.log(req.session.users);
    if (req.session.users) {
      console.log("로그아웃중입니다!");
      req.session.destroy((err) => {
        if (err) {
          console.log("세션 삭제시에 에러가 발생했습니다.");
          return;
        }
        console.log("세션이 삭제됐습니다.3");
        res.redirect("/main.ejs");
      });
    } else {
      console.log("로그인이 안돼있으시네요?");
      res.status(302).redirect("/main.ejs");
    }
});

//사진 업로드
app.post('/upload', upload.single('photo'), async (req, res) => {
  
  const title = req.body.title;
  const comment = req.body.comment;
  const image=`/images/${req.file.filename}`;
  const selectedTags = req.body.tags || [];
  try {
    if (req.session.users) {
      const userid=  req.session.users.id;
      const con = await pool.promise().getConnection();
      console.log('Connected to database');
      
      // 이미지 개수 가져오기
      const countResults = await con.query('SELECT COUNT(*) AS count FROM photo;');
      con.release();
      const count = countResults[0][0].count;
      console.log(count);
     
      if(count>0){
        const [rows] = await con.query('SELECT * FROM photo.photo;');
        con.release();
        const max_img_no = rows[rows.length-1].img_no;
        req.session.max_img_no=max_img_no;
        console.log(max_img_no);
      }
      // 이미지 삽입
      if(count==0){
        await con.query('INSERT INTO photo (img_no, img, title, comment, user_id) VALUES (?, ?, ?, ?, ?);',
        [count + 1, image , title, comment, userid]);
        //tag 삽입
        if(Array.isArray(selectedTags))
        {
          selectedTags.forEach(element => {
            console.log(element);
            con.query('INSERT INTO tag (img_no, tag) VALUES (?, ?);',
            [count+1, element]);
          });
        }else{
          console.log(selectedTags);
          con.query('INSERT INTO tag (img_no, tag) VALUES (?, ?);',
            [count+1, selectedTags]);
        }
        con.release();
      }else{
        await con.query('INSERT INTO photo (img_no, img, title, comment, user_id) VALUES (?, ?, ?, ?, ?);',
        [req.session.max_img_no+1, image , title, comment, userid]);
        if(Array.isArray(selectedTags))
        {
          selectedTags.forEach(element => {
            console.log(element);
            con.query('INSERT INTO tag (img_no, tag) VALUES (?, ?);',
            [req.session.max_img_no+1, element]);
          });
        }else{
          console.log(selectedTags);
          con.query('INSERT INTO tag (img_no, tag) VALUES (?, ?);',
            [req.session.max_img_no+1, selectedTags]);
        }
        con.release();
      }
      console.log('Insert success');
      res.status(500).redirect('/photos.ejs');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('서버 오류');
  }
});

//사진 삭제
app.post('/delete', async (req, res) => {
  try {
    if (req.session.users) {
      const con = await pool.promise().getConnection();
      const [rows] = await con.query('SELECT * FROM photo.photo WHERE user_id=?;', 
      [req.session.users.id]);
      con.release();
      

      if (rows.length > 0) {
        const photo_no = rows[req.body.index].img_no;
        console.log('delete');
        console.log(photo_no);

        const rows1 = await con.query('SELECT * FROM photo.photo WHERE img_no=?;', [photo_no]);
        con.release();
        const filePath=`./public${rows1[0][0].img}`;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('파일 삭제 중 에러 발생:', err);
            return;
          }
          console.log('파일이 성공적으로 삭제되었습니다.');
        });

        await con.query('DELETE FROM photo.tag WHERE img_no=?;', [photo_no]);
        con.release();

        await con.query('DELETE FROM photo.photo WHERE img_no=?;', [photo_no]);
        con.release();

        res.status(200).redirect("/mypictures.ejs");
      } else {
        console.log('데이터가 없습니다.');
        res.status(404).send('데이터가 없습니다.');
      }
    } else {
      console.log(`로그인하세요`);
      res.redirect('/login.ejs').end();
    }
  } catch (err) {
    console.error('에러 발생:', err);
    res.status(500).redirect('/main.ejs');
  }
});

//사진 수정
app.post('/formal', async(req,res)=>{
  try { 
    if (req.session.users) {
      console.log('test');
      const con = await pool.promise().getConnection();
      const [rows] = await con.query('SELECT * FROM photo.photo WHERE user_id=?;', 
      [req.session.users.id]);
      con.release();
      if (rows.length > 0) {
        
        const photo_no = rows[req.body.index].img_no;
        req.session.img_no=photo_no;
        const rows_photo = await con.query('SELECT * FROM photo.photo WHERE img_no=?;', [photo_no]);
        const rows_tag =await con.query('SELECT * FROM photo.tag WHERE img_no=?;', [photo_no]);
        con.release();
        console.log(rows_photo[0][0]);
        console.log(rows_tag[0][0]);
        console.log()
        res.status(200).render('photoupload.ejs',{
          formal:'1',
          photo_info:rows_photo[0][0],
          photo_tag:rows_tag[0][0].tag
        });
      }
    }else {
      console.log(`로그인하세요`);
      res.status(500).redirect('/login.ejs');
    }
  } catch (err) {
    console.error('에러 발생:', err);
    res.status(500).send('서버 에러');
  }
});

//사진 수정 업로드
app.post('/format_upload', upload.single('photo'), async(req,res)=>{
  try {
    if(req.session.users){
      const title=req.body.title;
      const comment=req.body.comment;
      const image=`/images/${req.file.filename}`;
      const selectedTags = req.body.tags || [];
      const con = await pool.promise().getConnection();

      const rows1 = await con.query('SELECT * FROM photo.photo WHERE img_no=?;', [req.session.img_no]);
        con.release();
        const filePath=`./public${rows1[0][0].img}`;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error('파일 삭제 중 에러 발생:', err);
            return;
          }
          console.log('파일이 성공적으로 삭제되었습니다.');
        });

        await con.query('UPDATE photo.photo SET img=?, title=?, comment=? WHERE img_no=?;', 
        [image, title, comment, req.session.img_no]);
      
      con.release();
      
      if(Array.isArray(selectedTags))
        {
          selectedTags.forEach(element => {
            console.log(element);
            con.query('update photo.tag set tag=? where img_no=?;',
            [element, req.session.img_no]);
          });
        }else{
          console.log(selectedTags);
          con.query('update photo.tag set tag=? where img_no=?;',
            [selectedTags, req.session.img_no]);
        }
        res.status(200).redirect('/photos.ejs');
    }else{
      console.log(`로그인하세요`);
      res.status(500).redirect('/login.ejs');
    }
    
  }catch(err){
    console.error('에러 발생:', err);
    res.status(500).send('서버 에러');
  }
});

app.post('/search', async(req,res)=>{
  try{
    
  }catch(err){
    console.error('에러 발생:', err);
    res.status(500).send('서버 에러');
  }
});

//서버 시작
app.listen(port, function(err){
    if(err) return console.log(err);
    console.log(`open server listen on port:${port}`);
});