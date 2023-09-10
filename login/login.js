const login_btn=document.getElementById("login_btn");

login_btn.addEventListener("click",(event)=>{
    sessionStorage.setItem("login",1);
    window.history.back()
})