console.log("Let's write JS code");

let currentSong = new Audio();
let songs = [];
let currFolder;

// Function to format time in MM:SS format
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// Function to fetch song list from the specified folder
async function getSongs(folder) {
    currFolder = folder;
    try {
        let response = await fetch(`/${folder}/`);
        let htmlText = await response.text();
        let div = document.createElement("div");
        div.innerHTML = htmlText;
        let as = div.getElementsByTagName("a");
        
        songs = [];
        for (let element of as) {
            if (element.href.endsWith(".mp3")) {
                let songName = decodeURIComponent(element.href.split(`/${folder}/`)[1]);
                songs.push(songName);
            }
        }
        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        return [];
    }
}

// Function to play music
const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("Invalid song file!");
        return;
    }
    
    let songPath = `/${currFolder}/` + encodeURIComponent(track);
    currentSong.src = songPath;
    
    currentSong.oncanplay = () => {
        if (!pause) {
            currentSong.play();
            document.getElementById("play").src = "/img/pause.svg";
        }
    };
    
    currentSong.onerror = () => {
        console.error("Error loading the song:", track);
    };
    
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// Function to update song list UI
async function updateSongList(folder) {
    songs = await getSongs(folder);
    let songUl = document.querySelector(".songlist ul");
    songUl.innerHTML = "";
    
    for (const song of songs) {
        let li = document.createElement("li");
        li.classList.add("flex-card");
        li.innerHTML = `
            <img class="invert" src="/img/music.svg" alt="">
            <div class="info">
                <div class="names">${song.replaceAll("%20", " ")}</div>
            </div>
            <div class="playnow">
                <img class="invert" src="/img/play.svg" alt="">
            </div>
        `;
        li.addEventListener("click", () => playMusic(song));
        songUl.appendChild(li);
    }
}

// Function to display album cards
async function displayAlbums() {
    let response = await fetch("/songs/");
    let htmlText = await response.text();
    let div = document.createElement("div");
    div.innerHTML = htmlText;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".card-container");
    cardContainer.innerHTML = "";

    for (let e of anchors) {
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-1)[0];
            try {
                let jsonResponse = await fetch(`/songs/${folder}/info.json`);
                if (!jsonResponse.ok) continue;
                let info = await jsonResponse.json();

                let card = document.createElement("div");
                card.classList.add("card");
                card.dataset.folder = folder;
                card.innerHTML = `
                    <div class="play">
                        <img src="/img/play.svg" class="play-btn" alt="Play">
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="" width="200" height="200">
                    <div class="written">
                        <h3>${info.title}</h3>
                        <p>${info.description}</p>
                    </div>
                `;
                card.addEventListener("click", async () => {
                    await updateSongList(`songs/${folder}`);
                    playMusic(songs[0]);
                });
                cardContainer.appendChild(card);
            } catch (error) {
                console.error("Error parsing JSON:", error);
            }
        }
    }
}

// Main function to initialize the player
async function main() {
    songs = await getSongs("songs/cs");
    if (songs.length > 0) playMusic(songs[0], true);
    displayAlbums();
    await updateSongList("songs/cs");
    
    document.getElementById("play").addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            document.getElementById("play").src = "/img/pause.svg";
        } else {
            currentSong.pause();
            document.getElementById("play").src = "/img/play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", (e) => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-100%";
    });

    document.getElementById("previous").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index > 0) playMusic(songs[index - 1]);
    });

    document.getElementById("next").addEventListener("click", () => {
        let index = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
        if (index < songs.length - 1) playMusic(songs[index + 1]);
    });
}

main();
