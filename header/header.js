const nav = document.getElementById("left");
const logout=document.getElementById("logout");
const login = sessionStorage.getItem("login");
if(login != 1)
{
    sessionStorage.setItem("login",0);
}
if (login ==1) {
  nav.innerHTML = `
    <button class="login_btn" onclick="logout_btn()">로그아웃</button>
    <button class="membership_btn"><a href="mypictures.html">마이페이지</a></button>`;
}

function logout_btn(){
  sessionStorage.removeItem("login");
  window.location.href = "main.html";
  nav.innerHTML = `<button class="login_btn"><a href="login.html">로그인</a></button>
  <button class="membership_btn"><a href="membership.html">회원가입</a></button>`;
}