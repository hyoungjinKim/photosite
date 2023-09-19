const reply_btn=document.getElementById('reply_btn');
const reply_input=document.getElementById('reply_input');
const reply_cancle=document.getElementById('reply_cancle');
const reply_wrap=document.getElementById('reply_wrap');


//대댓글 작성창 생성
reply_btn.addEventListener('click', function(){
    reply_input.innerHTML=`<span><input type="text" class="reply_input" id="reply"></span><span><button onclick="Submit()">submit</button></span>`;
});

//대댓글 작성창 취소
reply_cancle.addEventListener('click', function(){
    reply_input.innerHTML=``;
});

//대댓글 작성
function Submit(){
    let reply=document.getElementById('reply').value;
    reply_input.innerHTML=``;
    reply_wrap.innerHTML=
    `<div class="Writer">
        <span>user</span><span class="date">(2023/09/03)</span>
    </div>
    <div class="comment" id="reply_comment">${reply}</div>`;
}