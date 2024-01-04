const nav = document.getElementById("left");
const logout=document.getElementById("logout");
const login = sessionStorage.getItem("login");
if(login != 1)
{
    sessionStorage.setItem("login",0);
}
if (login ==1) {
  fetch("/process/nickname",{
    method: "get",
  }).then((res)=>res.text())
    .then((data)=>{
      nav.innerHTML = `
    <span>${data}</span>
    <button class="login_btn" onclick="logout_btn()"><a href="/logout">로그아웃</a></button>
    <button class="membership_btn"><a href="mypictures.html">마이페이지</a></button>`;
    }).catch((err)=>{
      console.log(err);
    })
  
}

function logout_btn(){
  sessionStorage.removeItem("login");
  nav.innerHTML = `<button class="login_btn"><a href="login.html">로그인</a></button>
  <button class="membership_btn"><a href="membership.html">회원가입</a></button>`;
}