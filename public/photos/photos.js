function toggleEditComment(commentNo) {
  const editCommentDiv = document.getElementById(`edit_comment_${commentNo}`);
  const comment = document.getElementById(`re_comment_${commentNo}`);
  if (editCommentDiv.style.display === "none") {
    editCommentDiv.style.display = "block";
    comment.style.display = "none";
  } else {
    editCommentDiv.style.display = "none";
    comment.style.display = "block";
  }
}

function Replywrite(replyNo) {
  const replybtn = document.getElementById(`reply_input_${replyNo}`);
  replybtn.style.display = "block";
}

function Replycancle(replyNo) {
  const replybtn = document.getElementById(`reply_input_${replyNo}`);
  replybtn.style.display = "none";
}

function Replychange(replyNo) {
  const replychange = document.getElementById(`reply_${replyNo}`);
  const ch_reply = document.getElementById(`replychform_${replyNo}`);
  if (ch_reply.style.display === "none") {
    ch_reply.style.display = "block";
    replychange.style.display = "none";
  } else {
    ch_reply.style.display = "none";
    replychange.style.display = "block";
  }
}
