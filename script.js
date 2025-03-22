// API key for WeatherAPI
const API_KEY = "f8a359dd9e774554bc8145743243012" // Replace with your actual WeatherAPI key
const BASE_URL = "https://api.weatherapi.com/v1"

// DOM Elements
const searchInput = document.getElementById("search-input")
const searchBtn = document.getElementById("search-btn")
const locationBtn = document.getElementById("location-btn")
const themeToggleBtn = document.getElementById("theme-toggle-btn")
const locationElement = document.getElementById("location")
const dateElement = document.getElementById("date")
const temperatureElement = document.getElementById("temperature")
const conditionElement = document.getElementById("condition")
const weatherIconElement = document.getElementById("weather-icon")
const humidityElement = document.getElementById("humidity")
const windSpeedElement = document.getElementById("wind-speed")
const feelsLikeElement = document.getElementById("feels-like")
const visibilityElement = document.getElementById("visibility")
const forecastItemsElement = document.getElementById("forecast-items")

// Initialize the app
function init() {
  // Load saved theme from localStorage
  loadTheme()

  // Event listeners
  searchBtn.addEventListener("click", handleSearch)
  searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch()
  })
  locationBtn.addEventListener("click", getCurrentLocationWeather)
  themeToggleBtn.addEventListener("click", toggleTheme)

  // Default to user's location or a default city
  if (navigator.geolocation) {
    getCurrentLocationWeather()
  } else {
    getWeatherData("London") // Default city
  }
}

// Theme toggle functionality
function toggleTheme() {
  const body = document.body
  if (body.classList.contains("light")) {
    body.classList.remove("light")
    body.classList.add("dark")
    localStorage.setItem("theme", "dark")
  } else {
    body.classList.remove("dark")
    body.classList.add("light")
    localStorage.setItem("theme", "light")
  }
}

// Load saved theme
function loadTheme() {
  const savedTheme = localStorage.getItem("theme")
  if (savedTheme === "dark") {
    document.body.classList.remove("light")
    document.body.classList.add("dark")
  }
}

// Handle search
function handleSearch() {
  const city = searchInput.value.trim()
  if (city) {
    getWeatherData(city)
  }
}

// Get current location
function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        getWeatherByCoordinates(latitude, longitude)
      },
      (error) => {
        console.error("Error getting location:", error)
        alert("Unable to get your location. Please search for a city instead.")
      },
    )
  } else {
    alert("Geolocation is not supported by your browser. Please search for a city instead.")
  }
}

// Get weather by city name
async function getWeatherData(city) {
  try {
    // Show loading state
    updateLoadingState(true)

    // Fetch current weather and forecast in one call
    const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${city}&days=5&aqi=no&alerts=no`)

    if (!response.ok) {
      throw new Error("City not found")
    }

    const data = await response.json()

    // Update UI with the data
    updateWeatherUI(data)
    updateForecastUI(data)

    // Clear loading state
    updateLoadingState(false)
  } catch (error) {
    console.error("Error fetching weather data:", error)
    alert(error.message || "Failed to fetch weather data. Please try again.")
    updateLoadingState(false)
  }
}

// Get weather by coordinates
async function getWeatherByCoordinates(lat, lon) {
  try {
    // Show loading state
    updateLoadingState(true)

    // Fetch current weather and forecast in one call
    const response = await fetch(`${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=5&aqi=no&alerts=no`)

    if (!response.ok) {
      throw new Error("Weather data not available")
    }

    const data = await response.json()

    // Update UI with the data
    updateWeatherUI(data)
    updateForecastUI(data)

    // Clear loading state
    updateLoadingState(false)
  } catch (error) {
    console.error("Error fetching weather data:", error)
    alert(error.message || "Failed to fetch weather data. Please try again.")
    updateLoadingState(false)
  }
}

// Update UI with current weather data
function updateWeatherUI(data) {
  const current = data.current
  const location = data.location

  // Update location and date
  locationElement.textContent = `${location.name}, ${location.country}`
  dateElement.textContent = formatDate(new Date(location.localtime))

  // Update temperature and condition
  temperatureElement.textContent = Math.round(current.temp_c)
  conditionElement.textContent = current.condition.text

  // Update weather icon - using emoji mapping based on condition code
  weatherIconElement.textContent = getWeatherEmoji(current.condition.code, isDay(location.localtime))

  // Update details
  humidityElement.textContent = `${current.humidity}%`
  windSpeedElement.textContent = `${current.wind_kph.toFixed(1)} km/h`
  feelsLikeElement.textContent = `${Math.round(current.feelslike_c)}°C`
  visibilityElement.textContent = `${current.vis_km.toFixed(1)} km`
}

// Update UI with forecast data
function updateForecastUI(data) {
  // Clear previous forecast
  forecastItemsElement.innerHTML = ""

  // Create forecast items
  data.forecast.forecastday.forEach((day) => {
    const forecastDate = new Date(day.date)
    const dayName = getDayName(forecastDate)
    const temp = Math.round(day.day.avgtemp_c)
    const condition = day.day.condition.text
    const isDay = true // Always use day icons for forecast

    const forecastItem = document.createElement("div")
    forecastItem.className = "forecast-item"
    forecastItem.innerHTML = `
      <p class="forecast-day">${dayName}</p>
      <div class="forecast-icon">${getWeatherEmoji(day.day.condition.code, isDay)}</div>
      <p class="forecast-temp">${temp}°C</p>
      <p class="forecast-condition">${condition}</p>
    `

    forecastItemsElement.appendChild(forecastItem)
  })
}

// Map WeatherAPI condition codes to emoji
function getWeatherEmoji(code, isDay) {
  // Map common weather condition codes to emojis
  const codeMap = {
    // Clear/Sunny
    1000: isDay ? "☀️" : "🌙",

    // Partly cloudy
    1003: isDay ? "⛅" : "☁️",

    // Cloudy
    1006: "☁️",
    1009: "☁️",

    // Mist/Fog
    1030: "🌫️",
    1135: "🌫️",
    1147: "🌫️",

    // Rain
    1063: "🌦️",
    1180: "🌦️",
    1183: "🌧️",
    1186: "🌧️",
    1189: "🌧️",
    1192: "🌧️",
    1195: "🌧️",
    1240: "🌧️",
    1243: "🌧️",
    1246: "🌧️",

    // Snow
    1066: "❄️",
    1114: "❄️",
    1210: "❄️",
    1213: "❄️",
    1216: "❄️",
    1219: "❄️",
    1222: "❄️",
    1225: "❄️",
    1255: "❄️",
    1258: "❄️",

    // Sleet
    1069: "🌨️",
    1072: "🌨️",
    1150: "🌨️",
    1153: "🌨️",
    1168: "🌨️",
    1171: "🌨️",
    1198: "🌨️",
    1201: "🌨️",
    1204: "🌨️",
    1207: "🌨️",
    1249: "🌨️",
    1252: "🌨️",

    // Thunderstorm
    1087: "⛈️",
    1273: "⛈️",
    1276: "⛈️",
    1279: "⛈️",
    1282: "⛈️",
  }

  return codeMap[code] || "🌤️" // Default icon if code not found
}

// Check if it's daytime based on local time
function isDay(localtime) {
  const hour = new Date(localtime).getHours()
  return hour >= 6 && hour < 18 // Simple day/night check (6 AM to 6 PM)
}

// Format date to readable string
function formatDate(date) {
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }
  return date.toLocaleDateString("en-US", options)
}

// Get day name from date
function getDayName(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" })
}

// Update loading state
function updateLoadingState(isLoading) {
  if (isLoading) {
    locationElement.textContent = "Loading..."
    temperatureElement.textContent = "--"
    conditionElement.textContent = "--"
    weatherIconElement.textContent = "🔄"
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", init)

