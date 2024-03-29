const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const expressSession = require("express-session");
const cookie = require("cookie-parser");
const fs = require("fs");
const multer = require("multer");

const app = express();

app.set("views", path.join(__dirname, "/views"));
app.set("view engine", "ejs");

const storage = multer.diskStorage({
  destination: function (req, file, cd) {
    cd(null, "./public/images/");
  },
  filename: function (req, file, cd) {
    const ext = path.extname(file.originalname);
    cd(null, path.basename(file.originalname, ext) + "-" + Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

//db 정보 받아옴
const dbconfig = require(`./config/dbconfig`);
//session 정보
const session = require(`./config/session.json`);

//포트 번호
const port = 4003;

//받아온 데이터 변환
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
//public폴더를 최상위 폴더로 바꿈
app.use(express.static(path.join(__dirname, "public")));
app.use(cookie());

//express-session
app.use(
  expressSession({
    secret: session.key, //암호화에 사용될 키
    name: session.name, //session 이름
    resave: false, //세션을 언제나 저장할지 설정
    saveUninitialized: false, //세션에 저장할 내역이 없더라도 처음부터 세션을 생성할지 설정
    cookie: {
      //세션 쿠키 설정
      httpOnly: true, //js로 세션 쿠키를 사용할수 없도록 함
    },
  })
);

//db pool로 생성
const pool = mysql.createPool({
  connectionLimit: 10,
  host: dbconfig.host,
  port: dbconfig.port,
  user: dbconfig.user,
  password: dbconfig.password,
  database: dbconfig.database,
  debug: false,
});

const setHeaderData = (req, res, next) => {
  // 사용자가 로그인한 경우
  if (req.session.users && req.session.users.Logined) {
    res.locals.name = req.session.users.name;
  } else {
    // 로그인하지 않은 경우
    res.locals.name = "";
  }
  next();
};

app.use(setHeaderData);

//index페이지
app.get("/", async (req, res) => {
  await pool.getConnection((err, con) => {
    if (err) {
      console.log("sql run err");
      console.dir(err);
      res.status("500").redirect("/");
      res.end();
    } else {
      con.query("select * from photo.photo;", (err, rows) => {
        con.release();
        if (err) {
          console.log("sql run err");
          console.dir(err);
          res.status(500).redirect("/");
          res.end();
          return;
        }
        const sort = [...rows].sort(
          (a, b) => b.Recommendation - a.Recommendation
        );
        return res.render("main.ejs", {
          photo: rows,
          sort: sort,
        });
      });
    }
  });
});

//login페이지
app.get("/login.ejs", (req, res) => {
  res.render("login.ejs");
});

//회원가입페이지
app.get("/membership.ejs", (req, res) => {
  res.render("membership.ejs");
});

//loginerr페이지
app.get("/loginerr.ejs", (req, res) => {
  res.render("loginerr.ejs");
});

//스크랩페이지
app.get("/scrap.ejs", async (req, res) => {
  try {
    if (req.session.users) {
      const con = await pool.promise().getConnection();
      const id = req.session.users.id;
      const [img] = await con.query(
        "SELECT * FROM photo.scrap LEFT JOIN photo.photo ON scrap.img_no = photo.img_no WHERE scrap.user_id = ?;",
        [id]
      );
      res.status(200).render("scrap.ejs", {
        photo: img,
      });
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//검색페이지
app.get("/search.ejs", (req, res) => {
  res.render("search.ejs");
});

//사진 페이지
app.get("/photos/:photoId", async (req, res) => {
  try {
    const photoId = req.params.photoId;
    pool.getConnection((err, con) => {
      if (err) {
        console.error("연결 오류:", err);
        res.status(500).send("서버 에러");
        return;
      }
      con.query(
        "SELECT * FROM photo.photo WHERE img_no = ?;",
        [photoId],
        (err, img) => {
          if (err) {
            console.error("이미지 쿼리 오류:", err);
            res.status(500).send("서버 에러");
            connection.release();
            return;
          }
          con.query(
            "SELECT * FROM photo.tag WHERE img_no = ?;",
            [photoId],
            (err, tag) => {
              if (err) {
                console.error("태그 쿼리 오류:", err);
                res.status(500).send("서버 에러");
                con.release();
                return;
              }
              con.query(
                "SELECT * FROM photo.user WHERE id = ?;",
                [img[0].user_id],
                (err, user) => {
                  if (err) {
                    console.error("사용자 쿼리 오류:", err);
                    res.status(500).send("쿼리 에러");
                    con.release();
                    return;
                  }
                  con.query(
                    "select * from photo.comment where img_no=?",
                    [photoId],
                    async (err, comment) => {
                      if (err) {
                        console.error("쿼리 오류:", err);
                        res.status(500).send("쿼리 에러");
                        con.release();
                        return;
                      }

                      try {
                        const [com_user] = await con
                          .promise()
                          .query(
                            "SELECT * FROM photo.comment WHERE img_no=?;",
                            [photoId]
                          );

                        const namePromises = com_user.map(async (comment) => {
                          const [name] = await con
                            .promise()
                            .query("SELECT * FROM photo.user WHERE id=?", [
                              comment.user_id,
                            ]);
                          return name[0];
                        });
                        const names = await Promise.all(namePromises);

                        const [reply_user] = await con
                          .promise()
                          .query(
                            "select * from reply left join user on user.id=reply.user_id;"
                          );

                        const [reply] = await con
                          .promise()
                          .query(
                            "select * from photo.reply left join user on user.id=reply.user_id;"
                          );
                        if (req.session.users) {
                          return res.status(200).render("photos.ejs", {
                            img: img[0],
                            tag: tag,
                            user: user[0],
                            comment: comment,
                            names: names,
                            reqname: req.session.users.name,
                            reply: reply,
                            replyuser: reply_user,
                          });
                        } else {
                          return res.status(200).render("photos.ejs", {
                            img: img[0],
                            tag: tag,
                            user: user[0],
                            comment: comment,
                            names: names,
                            reqname: 0,
                            reply: reply,
                          });
                        }
                      } catch (err) {
                        console.error("쿼리 오류:", err);
                        res.status(500).send("서버 에러");
                      } finally {
                        con.release();
                      }
                    }
                  );
                }
              );
            }
          );
        }
      );
    });
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//내가 업로드한 사진
app.get("/mypictures.ejs", async (req, res) => {
  if (req.session.users) {
    await pool.getConnection((err, con) => {
      if (err) {
        console.log("sql run err");
        console.dir(err);
        res.status(500).redirect("/");
        res.end();
      }
      con.query(
        `select * from photo.photo where user_id=?;`,
        [req.session.users.id],
        (err, rows) => {
          con.release();
          if (err) {
            console.log("sql run err");
            console.dir(err);
            res.status(500).redirect("/");
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
    res.redirect("/login.ejs");
  }
});

//사진 업로드
app.get("/photoupload.ejs", (req, res) => {
  res.render("photoupload.ejs", {
    formal: "0",
  });
});

//회원가입
app.post("/process/adduser", async (req, res) => {
  console.log(`/adduser 호출됨${req}`);

  const paramid = req.body.id;
  const parampassword = req.body.password;
  const paramnickname = req.body.nickname;
  try {
    const con = await pool.promise().getConnection();

    console.log("connect db");
    await con.query(
      "INSERT INTO user (id, pw, nickname) VALUES (?, SHA2(?,256), ?);",
      [paramid, parampassword, paramnickname]
    );
    con.release();

    console.log("insert success");
    res.redirect("/login.ejs");
  } catch (err) {
    console.error("sql run err");
    console.error(err);
    res.status(500).send("<h2>SQL query 실행 실패</h2>");
    res.end();
  }
});

//login
app.post("/login", async (req, res) => {
  console.log("process/login req" + req);
  const paramid = req.body.id;
  const parampassword = req.body.password;

  await pool.getConnection((err, con) => {
    con.release();
    if (err) {
      console.log("sql run err");
      console.dir(err);
      res.status("500").send("<h2>sql quary 실행 실패</h2>");
      res.end();
      return;
    }
    con.query(
      "select * from photo.user where id=? and pw= SHA2(?,256);",
      [paramid, parampassword],
      (err, rows) => {
        con.release();
        if (err) {
          console.log("sql run err");
          console.dir(err);
          res.status(500).redirect("/");
          res.end();
          return;
        }
        if (rows.length > 0) {
          if (req.session.users) {
            // 세션에 유저가 존재한다면
            if (req.session.users.name != rows[0].nickname) {
              req.session.destroy((err) => {
                if (err) {
                  console.log("세션 삭제시에 에러가 발생했습니다.");
                  res.writeHead("500").write(`<h2>session delete err</h2>`);
                  return;
                }
                console.log("세션이 삭제됐습니다.");
                res.redirect("/login.ejs");
              });
            }
            console.log("이미 로그인 돼있습니다~");
            res.status(200).redirect("/");
            res.end();
          } else {
            req.session.users = {
              id: paramid,
              Logined: true,
              name: rows[0].nickname,
              authorized: true,
            };
            res.status(200).redirect("/");
            res.end();
          }
          res.end();
          return;
        } else {
          if (req.session.users) {
            req.session.destroy((err) => {
              if (err) {
                console.log("세션 삭제시에 에러가 발생했습니다.");
                return;
              }
              console.log("세션이 삭제됐습니다.1");
            });
          }
          console.log(`아이디와 패스워드 일치 안함`);
          res.status(500).redirect("/loginerr.ejs");
          res.end();
          return;
        }
      }
    );
  });
});

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
      res.redirect("/");
    });
  } else {
    console.log("로그인이 안돼있으시네요?");
    res.status(302).redirect("/");
  }
});

//사진 업로드
app.post("/upload", upload.single("photo"), async (req, res) => {
  const title = req.body.title;
  const comment = req.body.comment;
  const image = `/images/${req.file.filename}`;
  const selectedTags = req.body.tags || [];
  try {
    if (req.session.users) {
      const userid = req.session.users.id;
      const con = await pool.promise().getConnection();
      console.log("Connected to database");

      // 이미지 개수 가져오기
      const countResults = await con.query(
        "SELECT COUNT(*) AS count FROM photo;"
      );
      con.release();
      const count = countResults[0][0].count;
      console.log(count);

      if (count > 0) {
        const [rows] = await con.query("SELECT * FROM photo.photo;");
        con.release();
        const max_img_no = rows[rows.length - 1].img_no;
        req.session.max_img_no = max_img_no;
        console.log(max_img_no);
      }
      // 이미지 삽입
      if (count == 0) {
        await con.query(
          "INSERT INTO photo (img_no, img, title, Recomendation,comment, user_id) VALUES (?, ?, ?,?, ?, ?);",
          [count + 1, image, title, 0, comment, userid]
        );
        //tag 삽입
        if (Array.isArray(selectedTags)) {
          selectedTags.forEach((element) => {
            console.log(element);
            con.query("INSERT INTO tag (img_no, tag) VALUES (?, ?);", [
              count + 1,
              element,
            ]);
          });
        } else {
          console.log(selectedTags);
          con.query("INSERT INTO tag (img_no, tag) VALUES (?, ?);", [
            count + 1,
            selectedTags,
          ]);
        }
        con.release();
      } else {
        await con.query(
          "INSERT INTO photo (img_no, img, title, comment, user_id) VALUES (?, ?, ?, ?, ?);",
          [req.session.max_img_no + 1, image, title, comment, userid]
        );
        if (Array.isArray(selectedTags)) {
          selectedTags.forEach((element) => {
            console.log(element);
            con.query("INSERT INTO tag (img_no, tag) VALUES (?, ?);", [
              req.session.max_img_no + 1,
              element,
            ]);
          });
        } else {
          console.log(selectedTags);
          con.query("INSERT INTO tag (img_no, tag) VALUES (?, ?);", [
            req.session.max_img_no + 1,
            selectedTags,
          ]);
        }
        con.release();
      }
      console.log("Insert success");
      res.status(500).redirect(`/photos/${req.session.max_img_no + 1}`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("서버 오류");
  }
});

//사진 삭제
app.post("/delete", async (req, res) => {
  try {
    if (req.session.users) {
      const con = await pool.promise().getConnection();
      const [rows] = await con.query(
        "SELECT * FROM photo.photo WHERE user_id=?;",
        [req.session.users.id]
      );
      con.release();

      if (rows.length > 0) {
        const photo_no = rows[req.body.index].img_no;
        const rows1 = await con.query(
          "SELECT * FROM photo.photo WHERE img_no=?;",
          [photo_no]
        );
        con.release();
        const filePath = `./public${rows1[0][0].img}`;
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error("파일 삭제 중 에러 발생:", err);
            return;
          }
          console.log("파일이 성공적으로 삭제되었습니다.");
        });

        await con.query("DELETE FROM photo.tag WHERE img_no = ?;", [photo_no]);
        await con.query("DELETE FROM photo.reply WHERE img_no = ?;", [
          photo_no,
        ]);
        await con.query("DELETE FROM photo.comment WHERE img_no = ?;", [
          photo_no,
        ]);
        await con.query("DELETE FROM photo.scrap WHERE img_no = ?;", [
          photo_no,
        ]);
        await con.query("DELETE FROM photo.photo  WHERE img_no = ?;", [
          photo_no,
        ]);
        con.release();

        res.status(200).redirect("/mypictures.ejs");
      } else {
        console.log("데이터가 없습니다.");
        res.status(404).send("데이터가 없습니다.");
      }
    } else {
      console.log(`로그인하세요`);
      res.redirect("/login.ejs").end();
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).redirect("/");
  }
});

//사진 수정
app.post("/formal", async (req, res) => {
  try {
    if (req.session.users) {
      console.log("test");
      const con = await pool.promise().getConnection();
      const [rows] = await con.query(
        "SELECT * FROM photo.photo WHERE user_id=?;",
        [req.session.users.id]
      );
      con.release();
      if (rows.length > 0) {
        const photo_no = rows[req.body.index].img_no;
        req.session.img_no = photo_no;
        const rows_photo = await con.query(
          "SELECT * FROM photo.photo WHERE img_no=?;",
          [photo_no]
        );
        const rows_tag = await con.query(
          "SELECT * FROM photo.tag WHERE img_no=?;",
          [photo_no]
        );
        con.release();
        console.log(rows_photo[0][0]);
        console.log(rows_tag[0][0]);
        console.log();
        res.status(200).render("photoupload.ejs", {
          formal: "1",
          photo_info: rows_photo[0][0],
          photo_tag: rows_tag[0][0].tag,
        });
      }
    } else {
      console.log(`로그인하세요`);
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//사진 수정 업로드
app.post("/format_upload", upload.single("photo"), async (req, res) => {
  try {
    if (req.session.users) {
      const title = req.body.title;
      const comment = req.body.comment;
      const image = `/images/${req.file.filename}`;
      const selectedTags = req.body.tags || [];
      const con = await pool.promise().getConnection();

      const rows1 = await con.query(
        "SELECT * FROM photo.photo WHERE img_no=?;",
        [req.session.img_no]
      );
      con.release();
      const filePath = `./public${rows1[0][0].img}`;
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("파일 삭제 중 에러 발생:", err);
          return;
        }
        console.log("파일이 성공적으로 삭제되었습니다.");
      });

      await con.query(
        "UPDATE photo.photo SET img=?, title=?, comment=? WHERE img_no=?;",
        [image, title, comment, req.session.img_no]
      );

      con.release();

      if (Array.isArray(selectedTags)) {
        selectedTags.forEach((element) => {
          console.log(element);
          con.query("update photo.tag set tag=? where img_no=?;", [
            element,
            req.session.img_no,
          ]);
        });
      } else {
        console.log(selectedTags);
        con.query("update photo.tag set tag=? where img_no=?;", [
          selectedTags,
          req.session.img_no,
        ]);
      }
      res.status(200).redirect(`/photos/${req.session.img_no}`);
    } else {
      console.log(`로그인하세요`);
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//검색
app.post("/search", async (req, res) => {
  try {
    const selectedTags = req.body.tags || [];
    const search = req.body.search;
    const con = await pool.promise().getConnection();

    let search_tag;
    if (Array.isArray(selectedTags) && selectedTags.length > 0) {
      const promises = selectedTags.map(async (element) => {
        try {
          const [tagResult] = await con.query(
            "SELECT * FROM photo.tag WHERE tag=?;",
            [element]
          );
          return tagResult;
        } catch (error) {
          console.error("에러 발생:", error);
          return [];
        }
      });
      // 모든 Promise가 완료될 때까지 기다림
      search_tag = await Promise.all(promises);
    } else if (typeof selectedTags === "string" && selectedTags.length > 0) {
      try {
        const [tagResult] = await con.query(
          "SELECT * FROM photo.tag WHERE tag=?;",
          [selectedTags]
        );
        search_tag = [tagResult];
      } catch (error) {
        console.error("에러 발생:", error);
        search_tag = [];
      }
    } else {
      search_tag = [];
    }
    // 검색된 이미지 번호를 배열로 추출
    const imgNos = search_tag.reduce((acc, tagResult) => {
      if (tagResult.length > 0) {
        // 여러 개의 값 모두를 배열에 추가
        acc = acc.concat(tagResult.map((item) => item.img_no));
      }
      return acc;
    }, []);

    let search_title;
    if (imgNos.length > 0) {
      // 이미지 번호가 있는 경우
      search_title = await con.query(
        "SELECT * FROM photo.photo WHERE img_no IN (?) AND title LIKE ?;",
        [imgNos, `%${search}%`]
      );
    } else {
      // 이미지 번호가 없는 경우 또는 태그가 선택되지 않은 경우
      search_title = await con.query(
        "SELECT * FROM photo.photo WHERE title LIKE ?;",
        [`%${search}%`]
      );
    }
    con.release();
    req.session.search = search_title[0];
    res.status(200).render("search.ejs", {
      photo: search_title[0],
      sort: 0,
    });
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//정렬
app.post("/sort2", async (req, res) => {
  try {
    const re_search = req.session.search;
    const sort = req.body.sorting;
    console.log(sort);
    if (sort == "인기순") {
      const sortedResults = [...re_search].sort(
        (a, b) => a.Recommendation - b.Recommendation
      );
      res.status(200).render("search.ejs", {
        photo: sortedResults,
        sort: 1,
      });
    } else if (sort == "최신순") {
      const re_search = req.session.search;
      res.status(200).render("search.ejs", {
        photo: re_search,
        sort: 2,
      });
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//추천
app.post("/recommend", async (req, res) => {
  try {
    const imgnum = req.body.index;
    const con = await pool.promise().getConnection();
    const [recom] = await con.query(
      "SELECT * FROM photo.photo WHERE img_no=?;",
      [imgnum],
      (err) => {
        if (err) {
          console.error("쿼리 오류:", err);
          res.status(500).send("서버 에러");
          con.release();
          return;
        }
      }
    );
    if (recom[0].Recommendation == null) {
      await con.query(
        "UPDATE photo.photo SET Recommendation=? WHERE img_no=?;",
        [1, imgnum],
        (err) => {
          if (err) {
            console.error("쿼리 오류:", err);
            res.status(500).send("서버 에러");
            con.release();
            return;
          }
        }
      );
    } else {
      await con.query(
        "UPDATE photo.photo SET Recommendation=? WHERE img_no=?;",
        [recom[0].Recommendation + 1, imgnum],
        (err) => {
          if (err) {
            console.error("쿼리 오류:", err);
            res.status(500).send("서버 에러");
            con.release();
            return;
          }
        }
      );
    }
    con.release();
    res.status(200).redirect(`/photos/${imgnum}`);
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//scrap
app.post("/scrap", async (req, res) => {
  try {
    if (req.session.users) {
      const imgnum = req.body.index;
      const con = await pool.promise().getConnection();
      const [row] = await con.query(
        "SELECT * FROM photo.scrap WHERE user_id = ? AND img_no = ?;",
        [req.session.users.id, imgnum],
        (err) => {
          if (err) {
            console.error("쿼리 오류:", err);
            res.status(500).send("서버 에러");
            con.release();
            return;
          }
        }
      );
      if (row[0] != undefined) {
        con.query(
          "DELETE FROM photo.scrap WHERE user_id=? AND img_no=?;",
          [req.session.users.id, imgnum],
          (err) => {
            if (err) {
              console.error("쿼리 오류:", err);
              res.status(500).send("서버 에러");
              con.release();
              return;
            }
          }
        );
      } else {
        await con.query(
          "INSERT INTO scrap (user_id, img_no) VALUES (?, ?);",
          [req.session.users.id, imgnum],
          (err) => {
            if (err) {
              console.error("쿼리 오류:", err);
              res.status(500).send("서버 에러");
              con.release();
              return;
            }
          }
        );
      }
      con.release();
      res.status(200).redirect(`/photos/${imgnum}`);
    } else {
      console.log(`로그인하세요`);
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//댓글
app.post("/comment", async (req, res) => {
  try {
    if (req.session.users) {
      const comment = req.body.comment;
      const imgnum2 = req.body.index2;
      const con = await pool.promise().getConnection();
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const now = `${year}-${month}-${day}`;

      const [countResults] = await con.query(
        "SELECT COUNT(*) AS count FROM comment;"
      );
      const count = countResults[0].count;

      if (count > 0) {
        const [rows] = await con.query("SELECT * FROM photo.comment;");
        const max_com_no = rows[rows.length - 1].comment_no;

        await con.query(
          "INSERT INTO comment (comment_no, comment, date, img_no, user_id) VALUES (?, ?, ?, ?, ?);",
          [max_com_no + 1, comment, now, imgnum2, req.session.users.id]
        );
        con.release();
      }
      if (count == 0) {
        await con.query(
          "INSERT INTO comment (comment_no, comment, date, img_no, user_id) VALUES (?, ?, ?, ?, ?);",
          [count + 1, comment, now, imgnum2, req.session.users.id]
        );
        con.release();
      }
      res.status(200).redirect(`/photos/${imgnum2}`);
    } else {
      console.log("로그인하세요");
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//댓글 삭제
app.post("/del_re", async (req, res) => {
  try {
    if (req.session.users) {
      const con = await pool.promise().getConnection();
      const com_no = req.body.index_com_no;
      const img_no = req.body.index_img_no;
      await con.query("DELETE FROM photo.reply WHERE comment_no=?;", [com_no]);
      await con.query("DELETE FROM photo.comment WHERE comment_no=?;", [
        com_no,
      ]);
      con.release();
      res.redirect(`/photos/${img_no}`);
    } else {
      console.log("로그인하세요");
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//댓글 수정
app.post("/comm_re", async (req, res) => {
  try {
    if (req.session.users) {
      const con = await pool.promise().getConnection();
      const com_no = req.body.index_com_no;
      const img_no = req.body.index_img_no;
      const comment = req.body.com;
      await con.query(
        "UPDATE photo.comment SET comment=? WHERE comment_no=?;",
        [comment, com_no]
      );
      res.status(200).redirect(`/photos/${img_no}`);
    } else {
      console.log("로그인하세요");
      res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    res.status(500).send("서버 에러");
  }
});

//대댓글
app.post("/reply_input", async (req, res) => {
  try {
    if (req.session.users) {
      const reply = req.body.reply;
      const img_no = req.body.index_img_no;
      const com_no = req.body.index_com_no;
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      const now = `${year}-${month}-${day}`;
      const con = await pool.promise().getConnection();
      await con.query(
        "INSERT INTO reply (reply, date, comment_no, user_id, img_no) VALUES (?, ?, ?, ?, ?);",
        [reply, now, com_no, req.session.users.id, img_no]
      );
      return res.status(200).redirect(`/photos/${img_no}`);
    } else {
      console.log("로그인하세요");
      return res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    return res.status(500).send("서버 에러");
  }
});

//대댓글 삭제
app.post("/reply_del", async (req, res) => {
  try {
    if (req.session.users) {
      const reply_no = req.body.reply_no;
      const img_no = req.body.img_no;
      const con = await pool.promise().getConnection();
      await con.query("DELETE FROM photo.reply WHERE reply_no=?;", [reply_no]);
      return res.status(200).redirect(`/photos/${img_no}`);
    } else {
      console.log("로그인하세요");
      return res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    return res.status(500).send("서버 에러");
  }
});

//대댓글 수정
app.post("/reply_ch", async (req, res) => {
  try {
    if (req.session.users) {
      const reply_no = req.body.reply_no;
      const img_no = req.body.img_no;
      const ch_reply = req.body.ch_reply;
      const con = await pool.promise().getConnection();
      await con.query("UPDATE photo.reply SET reply=? WHERE reply_no=?;", [
        ch_reply,
        reply_no,
      ]);
      return res.status(200).redirect(`/photos/${img_no}`);
    } else {
      console.log("로그인하세요");
      return res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    return res.status(500).send("서버 에러");
  }
});

//스크랩 검색
app.post("/search_scrap", async (req, res) => {
  try {
    if (req.session.users) {
      const title = req.body.search;
      const con = await pool.promise().getConnection();
      const [photo] = await con.query(
        "select * from photo.photo left join scrap on photo.img_no=scrap.img_no where title LIKE ? and scrap.user_id=? and photo.img_no is not null;",
        [`%${title}%`, `${req.session.users.id}`]
      );
      con.release();
      console.log(photo[0]);
      return res.status(200).render("scrap.ejs", {
        photo: photo,
      });
    } else {
      console.log("로그인하세요");
      return res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    return res.status(500).send("서버 에러");
  }
});

//내 사진 검색
app.post("/search_myphoto", async (req, res) => {
  try {
    if (req.session.users) {
      const title = req.body.my_search;
      const con = await pool.promise().getConnection();
      const [photo] = await con.query(
        "select * from photo where title like ? and user_id=?",
        [`%${title}%`, req.session.users.id]
      );
      con.release();
      return res.status(200).render("mypictures.ejs", {
        photo: photo,
      });
    } else {
      console.log("로그인하세요");
      return res.status(500).redirect("/login.ejs");
    }
  } catch (err) {
    console.error("에러 발생:", err);
    return res.status(500).send("서버 에러");
  }
});

//서버 시작
app.listen(port, function (err) {
  if (err) return console.log(err);
  console.log(`open server listen on port:${port}`);
});
