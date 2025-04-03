document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#resetPasswordForm");
    const messageBox = document.querySelector("#message");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
  
      const oldPassword = document.getElementById("oldPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();
  

  
      if (!oldPassword || !newPassword || !confirmPassword) {
        messageBox.innerHTML = `<div class="alert alert-danger">Vui lòng nhập đầy đủ các trường mật khẩu.</div>`;
        return;
      }
  
      if (newPassword !== confirmPassword) {
        messageBox.innerHTML = `<div class="alert alert-danger">Mật khẩu mới và xác nhận không khớp.</div>`;
        return;
      }
  
      try {
        const resUser = await fetch("/users/me");
        const userData = await resUser.json();
  
        if (!userData.user || !userData.user.id) {
          messageBox.innerHTML = `<div class="alert alert-danger">Không thể xác định người dùng!</div>`;
          return;
        }
  
        const userId = userData.user.id;
  
        const res = await fetch(`/users/${userId}/change-password`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
        });
  
        const data = await res.json();
  
        if (res.ok) {
          messageBox.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
          form.reset();
        } else {
          messageBox.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
      } catch (error) {
        messageBox.innerHTML = `<div class="alert alert-danger">Lỗi hệ thống. Vui lòng thử lại sau.</div>`;
      }
    });
  });
  