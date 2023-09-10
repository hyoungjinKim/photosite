const nav=document.getElementsByClassName("left_wrap");


if(sessionStorage.getItem("login")==1)
{
    nav.innerHTML=
    `<button class="login_btn">로그아웃</button>
    <button class="membership_btn"><a href="mypictures.html">마이페이지</a></button>`
}