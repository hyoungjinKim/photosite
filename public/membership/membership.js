const pw = document.getElementById("pw").value;
const conpw = document.getElementById("conpw").value;

if (pw != conpw) {
  alert("비밀번호가 동일하지 않습니다.");
  location.href = "login.ejs";
}
