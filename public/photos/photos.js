const combtn= document.getElementById('recom');
const comment=document.getElementsByName('comment');

function recom(){
    console.log(comment);
    const content=comment.innerHTML;
    comment.innerHTML=`<input name="com" value='${content.trim()}' dir="ltr">
                        <button type="submit">완료</button>`

}