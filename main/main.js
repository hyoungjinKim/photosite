const images = document.querySelectorAll('.main_photo');

//화면 슬라이드
let currentIndex = 0;

function showImage(index) {
  images[currentIndex].style.opacity = '0';
  currentIndex = (index + images.length) % images.length;
  images[currentIndex].style.opacity = '0.4';
}

function startSlider() {
  setInterval(() => {
    showImage(currentIndex + 1);
  }, 3000); // 이미지가 3초마다 변경됩니다.
}

showImage(currentIndex);
startSlider();


function tag(checkbox) {
  sessionStorage.setItem(checkbox.value, checkbox.checked);
}
window.onload = function() {
  let checkboxes = document.querySelectorAll('.tag');
  checkboxes.forEach(function(checkbox) {
      var isChecked = sessionStorage.getItem(checkbox.value) === 'true';
      checkbox.checked = isChecked;
  });
}