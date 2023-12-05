//태그 선택 저장
const tag_wrap=document.getElementById('tag_wrap');

function tag(checkbox) {
    sessionStorage.setItem(checkbox.value, checkbox.checked);
}
  
window.onload = function() {
    let checkboxes = document.querySelectorAll('.tag');
  
    checkboxes.forEach(function(checkbox) {
        let isChecked = sessionStorage.getItem(checkbox.value) === 'true';
        checkbox.checked = isChecked;
    });
    getCheckboxValue();
}

function getCheckboxValue()  {
    const query = 'input[name="tag"]:checked';
    const selectedEls = 
        document.querySelectorAll(query);
    let result = '';
    selectedEls.forEach((el) => {
      result += `<span>${el.value}</span>`;
    });
    tag_wrap.innerHTML= `${result}`;
}

const opTitle = document.querySelector('.group_option .select_op');
const opList = document.querySelector('.group_option .op_list');

//리스트 열고 닫기
opTitle.addEventListener('click',function(){
  opList.classList.toggle('on')
});

//리스트 선택 이벤트
opList.addEventListener('click', function(event){
  if(event.target.tagName !== 'BUTTON') return false;
  opTitle.innerText = event.target.innerText;
  opList.classList.remove('on');
});