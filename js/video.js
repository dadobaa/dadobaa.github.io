window.addEventListener('load', (event) => {
  const video = document.getElementById("video");
  const icon = document.getElementById("video-icon");
  video.addEventListener('click', () => {
    if (video.paused) {
      icon.innerHTML = "<i class=\"fa fa-play fa-solid\"></i>";
    } else {
      icon.innerHTML = "<i class=\"fa fa-pause fa-solid\"></i>";
    }
  })

  icon.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      icon.innerHTML = "<i class=\"fa fa-pause fa-solid\"></i>";
    } else {
      video.pause();
      icon.innerHTML = "<i class=\"fa fa-play fa-solid\"></i>";
    }
  })
})
