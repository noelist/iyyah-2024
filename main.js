// Animasi ditahan class "container" sampai halaman siap, supaya tumbuhnya
// bunga selalu terlihat dari frame pertama.
//
// Pemicunya DOMContentLoaded, bukan window.onload: onload baru jalan setelah
// audio remote dan Google Fonts selesai dimuat, jadi kalau koneksi lambat
// atau resource itu diblokir, halaman kelihatan kosong (semua animasi masih
// di keyframe 0% = scale(0)/height:0). Tetap dipasang fallback ke onload
// untuk browser yang script-nya sempat jalan setelah DOM selesai diparsing.
const revealFlowers = () => document.body.classList.remove("container");

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", revealFlowers, { once: true });
} else {
  revealFlowers();
}

window.addEventListener("load", revealFlowers, { once: true });

// --- Musik ---
//
// iOS memblokir autoplay beraudio: play() hanya diizinkan dari gesture user.
// Ini berlaku untuk semua browser di iPhone, karena Chrome/Firefox di iOS pun
// memakai WebKit. Chrome desktop juga memblokir di kunjungan pertama. Jadi
// atribut autoplay saja tidak cukup dan tidak bisa diandalkan.
//
// Strateginya tiga lapis, dari yang paling mulus ke yang paling pasti:
//   1. tetap coba play() saat load — jalan di browser yang mengizinkan
//   2. kalau ditolak, tap pertama di mana saja pada halaman yang memulainya
//   3. tombol toggle yang selalu terlihat, supaya user punya kendali eksplisit
//      dan tahu bahwa halaman ini memang ada musiknya
//
// Yang tidak bisa ditangani dari sini: saklar silent fisik iPhone tetap
// membisukan elemen <audio> walau play() berhasil. Itu disebut di title tombol.
const music = document.getElementById("linkmp3");
const musicToggle = document.getElementById("music-toggle");

if (music && musicToggle) {
  const renderState = () => {
    const playing = !music.paused;
    musicToggle.classList.toggle("music-toggle--on", playing);
    // Denyut petunjuk hanya saat musik mati, biar tidak jadi gangguan visual.
    musicToggle.classList.toggle("music-toggle--hint", !playing);
    musicToggle.setAttribute("aria-pressed", String(playing));
    musicToggle.setAttribute(
      "aria-label",
      playing ? "Matikan musik" : "Nyalakan musik"
    );
  };

  // play() menolak dengan NotAllowedError kalau kebijakan browser belum
  // terpenuhi. Itu kondisi normal di sini, bukan error yang perlu dilaporkan.
  const tryPlay = () => {
    const played = music.play();
    if (played && typeof played.catch === "function") {
      played.catch(() => {});
    }
  };

  const startOnFirstGesture = (event) => {
    // Tap pada tombolnya sendiri sudah ditangani handler tombol. Tanpa
    // pengecualian ini, pointerdown memutar musik lalu click langsung
    // menjedanya kembali, jadi tombolnya terasa mati di tap pertama.
    if (musicToggle.contains(event.target)) return;
    tryPlay();
  };

  document.addEventListener("pointerdown", startOnFirstGesture);
  music.addEventListener(
    "play",
    () => document.removeEventListener("pointerdown", startOnFirstGesture),
    { once: true }
  );

  music.addEventListener("play", renderState);
  music.addEventListener("pause", renderState);

  musicToggle.addEventListener("click", () => {
    if (music.paused) {
      tryPlay();
    } else {
      music.pause();
    }
  });

  renderState();
  tryPlay();
}
