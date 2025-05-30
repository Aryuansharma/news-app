const apiKeyWeather = "8d949a7c6bf18345b8b18fbf39b89c83";
const apiKeyNews = "111c0e5d381d3cacd4a244e260883dee";

const apiKey = "8d949a7c6bf18345b8b18fbf39b89c83"; // replace this with your real OpenWeather key

function getWeather() {
  const city = document.getElementById("weatherCity").value;

  // Current weather
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const result = `
        <h3>${data.name}</h3>
        <p>${data.weather[0].main} - ${data.weather[0].description}</p>
        <p>🌡 ${data.main.temp}°C</p>
      `;
      document.getElementById("weatherResult").innerHTML = result;
    });

  // 5-Day Forecast (every 3 hours, so pick every 8th entry = 1/day)
  fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
    .then(res => res.json())
    .then(data => {
      const forecastContainer = document.getElementById("forecastContainer");
      forecastContainer.innerHTML = "";

      const temps = [];
      const labels = [];

      for (let i = 0; i < data.list.length; i += 8) {
        const forecast = data.list[i];
        const date = new Date(forecast.dt_txt);
        const day = date.toLocaleDateString(undefined, { weekday: 'short' });
        const icon = forecast.weather[0].icon;
        const temp = forecast.main.temp;

        labels.push(day);
        temps.push(temp);

        const forecastHTML = `
          <div style="text-align: center;">
            <strong>${day}</strong><br>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" width="50"/><br>
            ${temp}°C
          </div>
        `;
        forecastContainer.innerHTML += forecastHTML;
      }

      // Draw the graph
      const ctx = document.getElementById("weatherChart").getContext("2d");
      if (window.weatherChart) window.weatherChart.destroy(); // clear old chart if exists
      window.weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Temperature (°C)',
            data: temps,
            backgroundColor: 'rgba(0,123,255,0.2)',
            borderColor: 'rgba(0,123,255,1)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: false
            }
          }
        }
      });
    });
}


// News 
function getNews() {
  const url = `https://gnews.io/api/v4/top-headlines?lang=en&country=in&token=${apiKeyNews}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const newsContainer = document.getElementById("newsContainer");
      newsContainer.innerHTML = "";
      data.articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "news-card";
        card.innerHTML = `
          <h3>${article.title}</h3>
          <p>${article.description || ""}</p>
          <a href="${article.url}" target="_blank">Read more →</a>
        `;
        newsContainer.appendChild(card);
      });
    });
}

// Search
function webSearch() {
  const query = document.getElementById("searchQuery").value;
  const url = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  window.open(url, "_blank");
}

// Navigation
function showSection(sectionId) {
  document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");

  if (sectionId === "news") getNews();
}
document.getElementById("toggleMode").onclick = () => {
  document.body.classList.toggle("dark");
};
function getNews() {
  const category = document.getElementById("newsCategory").value;
  const url = `https://gnews.io/api/v4/top-headlines?lang=en&country=in${category ? `&topic=${category}` : ""}&token=${apiKeyNews}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      const newsContainer = document.getElementById("newsContainer");
      newsContainer.innerHTML = "";
      data.articles.forEach(article => {
        const card = document.createElement("div");
        card.className = "news-card";
        card.innerHTML = `
          <h3>${article.title}</h3>
          <p>${article.description || ""}</p>
          <a href="${article.url}" target="_blank">Read more →</a>
        `;
        newsContainer.appendChild(card);
      });
    });
}
function getWeatherByLocation() {
  navigator.geolocation.getCurrentPosition(pos => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKeyWeather}&units=metric`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const result = `
          <h3>${data.name}</h3>
          <p>${data.weather[0].main} - ${data.weather[0].description}</p>
          <p>🌡 ${data.main.temp}°C</p>
        `;
        document.getElementById("weatherResult").innerHTML = result;
      });
  });
}
document.getElementById("toggleMode").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleMode");

  toggleBtn.textContent = "🌙 Dark Mode"; // Initial

  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      toggleBtn.textContent = "☀️ Light Mode";
    } else {
      toggleBtn.textContent = "🌙 Dark Mode";
    }
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const heading = document.querySelector("header h1");

  // Start with fadeSlideDown animation (already via CSS)
  // After animation ends, add glow class to keep glowing effect
  heading.addEventListener("animationend", () => {
    heading.classList.add("glow");
  });
});
document.addEventListener("DOMContentLoaded", () => {
  const headings = document.querySelectorAll(".glowing-heading");

  headings.forEach(heading => {
    heading.addEventListener("animationend", () => {
      heading.classList.add("glow");
    });
  });
});
function openGame(url) {
  window.open(url, "_blank");
}
function enterApp() {
  document.getElementById("welcome").style.display = "none";
  document.querySelector("header").style.display = "flex";
  document.querySelector("main").style.display = "block";

  sessionStorage.setItem("visited", "true"); // remember that user entered
}

window.addEventListener("DOMContentLoaded", () => {
  const visited = sessionStorage.getItem("visited");

  if (visited) {
    document.getElementById("welcome").style.display = "none";
    document.querySelector("header").style.display = "flex";
    document.querySelector("main").style.display = "block";
  } else {
    document.getElementById("welcome").style.display = "flex";
    document.querySelector("header").style.display = "none";
    document.querySelector("main").style.display = "none";
  }
});
document.getElementById("openSettings").onclick = () => {
  document.getElementById("settingsModal").style.display = "flex";
};

document.getElementById("closeSettings").onclick  = () => {
  document.getElementById("settingsModal").style.display = "none";
};

document.getElementById("darkModeToggle").onchange = (e) => {
  document.body.classList.toggle("dark", e.target.checked);
};

document.getElementById("brightnessControl").oninput = (e) => {
  document.body.style.filter = `brightness(${e.target.value}%)`;
};

document.getElementById("fontSizeControl").oninput = (e) => {
  document.body.style.fontSize = `${e.target.value}px`;
};

document.getElementById("volumeControl").oninput = (e) => {
  // Placeholder: Future audio volume handling
  const volume = e.target.value / 100;
  console.log("Volume set to:", volume);
};
function getStock() {
  const symbol = document.getElementById("stockSymbol").value.toUpperCase();
  const apiKey = "3c51366e30464c86af3c00678a43dc93"; // Replace with your actual API key
  const url = `https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${apiKey}`;

  fetch(url)
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (data.code) {
        throw new Error(`API error: ${data.message}`);
      }

      const result = `
        <h3>${data.name || symbol}</h3>
        <p>📈 Price: $${data.price}</p>
        <p>${data.percent_change >= 0 ? "🔺" : "🔻"} Change: ${data.change} (${data.percent_change}%)</p>
      `;
      document.getElementById("stockResult").innerHTML = result;
    })
    .catch(err => {
      document.getElementById("stockResult").innerHTML = `<p>Error: ${err.message}</p>`;
      console.error(err);

    });
}


    


