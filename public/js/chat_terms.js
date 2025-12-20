
document.addEventListener('DOMContentLoaded', () => {
  
  const agreeCheckbox = document.getElementById('agree-checkbox');
  const agreeBtn = document.getElementById('agreeBtn');
  const chatSendBtn = document.getElementById('chatSendBtn');
  const joinBtn = document.getElementById('joinBtn');
  const leaveBtn = document.getElementById('leaveBtn');

  agreeCheckbox.addEventListener('change', () => {
    agreeBtn.disabled = !agreeCheckbox.checked;
  });

  agreeBtn.addEventListener('click', () => {
    if (!agreeCheckbox.checked) return;

    agreeCheckbox.disabled = true;
    chatSendBtn.disabled = false;
    joinBtn.disabled = false;
    leaveBtn.disabled = false;
  });

  // Button Popups
  const popup = document.getElementById('hover-popup');

  // Select all buttons you want to show the popup for if disabled
  const allButtons = document.querySelectorAll('#chatSendBtn, #joinBtn, #leaveBtn, #agreeBtn, #downloadButton');
  
  allButtons.forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      if (btn.disabled) {
        popup.style.display = 'block';
        popup.style.left = e.pageX + 10 + 'px';
        popup.style.top = e.pageY + 10 + 'px';
      }
    });
    
    btn.addEventListener('mousemove', (e) => {
      if (btn.disabled) {
        popup.style.left = e.pageX + 10 + 'px';
        popup.style.top = e.pageY + 10 + 'px';
      }
    });
  
    btn.addEventListener('mouseleave', () => {
      popup.style.display = 'none';
    });
  });
});
