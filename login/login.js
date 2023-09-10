const login_btn=document.getElementById("login");

login_btn.addEventListener("click",(event)=>{
    sessionStorage.setItem("login",1);
    window.history.back()
})