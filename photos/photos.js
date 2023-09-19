const reply_btn=document.getElementById('reply_btn');
const reply_input=document.getElementById('reply_input');
const reply_cancle=document.getElementById('reply_cancle');

reply_btn.addEventListener('click', function(){
    reply_input.innerHTML=`<span><textarea></textarea></span><span><button>submit</button></span>`
});

reply_cancle.addEventListener('click', function(){
    reply_input.innerHTML=``
<<<<<<< HEAD
})
=======
})

>>>>>>> 23dc2b50ad9cc77457880ea374cf1df811782a9e
