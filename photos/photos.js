const commnetpart=document.getElementById('commentpart');
let count=0;

//댓글 작성
function Commentsubmit(){
    let comment_input=document.getElementById('comment_input');
    commnetpart.innerHTML +=    
    `<div class="comment_wrap">
     <div class="Writer">
        <span>user</span><span class="date">(2023/09/03)</span>
     </div>
     <div class="comment">${comment_input.value}</div>
     <div>
         <div><button onclick="Replywrite(this)">답글</button><button onclick="Replycancle(this)">취소</button></div>
         <div id="reply_input"></div>
     </div>
         <div class="reply_wrap" id="reply_wrap">
         </div>
     </div>`;
     comment_input.value=``;
}

//대댓글 작성창 생성
 function Replywrite(){
    const reply_input=document.getElementById(`reply_input`);
    document.getElementById(`reply_input`).innerHTML=`<span><input type="text" class="reply_input" id="reply"></span><span><button onclick="Submit()">submit</button></span>`;
};

//대댓글 작성창 취소
function Replycancle(){
    const reply_input=document.getElementById('reply_input');
    reply_input.innerHTML=``;
};

//대댓글 작성
function Submit(){
    const reply_wrap=document.getElementById(`reply_wrap`);
    let reply=document.getElementById(`reply`).value;
    reply_input.innerHTML=``;
    reply_wrap.innerHTML +=
    `<div class="Writer">
        <span>user</span><span class="date">(2023/09/03)</span>
    </div>
    <div class="comment" id="reply_comment"></div>`;
}