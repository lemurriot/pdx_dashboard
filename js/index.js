'use strict'

const STORE = {
    newsFeedPage: 1,
    picsFeedPage: 1,
    imageGallery: []
}

function loadingSpinner(){
    const overlay = document.getElementById("loading-spinner-overlay");
    window.addEventListener('load', function(){
        overlay.style.display = 'none';
    });
}

function handleError(section, err){
    $(section).empty();
    $(section).html(`<h3>${err}</h3>`);
}

function formatQueryParams(params) {
    const queryItems = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
    return queryItems.join('&');
  }

  
function renderBackground(image){
    $('body').css("backgroundImage", `url(${image})`);
}
    
function renderWeatherResults(json){
    const {temp, temp_min, temp_max} = json.main;
    getBackgroundImage(json.weather[0].main);
    $('.weather-list').html( `
            <div class="current-weather">
                <div class="current-temp">${temp.toFixed(1)}&#176 F</div>
                <div class="current-weather-description">${json.weather[0].description}</div>
            </div>
    `);
}


function renderNewsResults(json){
    $('#news-articles').empty();
    const {articles} = json;
    for (let i=0; i<articles.length - 1; i++){
        //check titles to avoid rendering duplicate news articles
        if (articles[i].title !== articles[i+1].title){
            const newsNode = document.createElement("LI");
            newsNode.innerHTML = `
            <h4>${articles[i].title}</h4>
            ${articles[i].urlToImage ? `<img class="article-img" src=${articles[i].urlToImage} alt="article image" />` : `<h6 class="article-img">No Image</h6>`}
            <p>${json.articles[i].description}</p>
            <h5><a href="${json.articles[i].url}" target="_blank">Go to article</a></h5>
            `;
            $('#news-articles').append(newsNode);
        }
    }
    $('#news-articles').append(`<li><button id="news-refresh-btn">Get More News</button></li>`)
    refreshNewsFeed();
}

function renderPictures(json){
        $('.row').empty();
        let counter = 0;
        json.hits.forEach(pic => {
            STORE.imageGallery.push({url: pic.largeImageURL, id: pic.id})
            if (counter < json.hits.length/3){
                $('.row-one').append(`<li><img title="Click to enlarge" class="gallery-img" id=${pic.id} src=${pic.previewURL} alt="${pic.tags} photo"></li>`)
                
            } else if (counter < json.hits.length/1.5){
                $('.row-two').append(`<li><img title="Click to enlarge" class="gallery-img" id=${pic.id} src=${pic.previewURL} alt="${pic.tags} photo"></li>`)
                
            } else {
                $('.row-three').append(`<li><img title="Click to enlarge" class="gallery-img" id=${pic.id} src=${pic.previewURL} alt="${pic.tags} photo"></li>`)
                
            }
            counter++
        })
}



function formatFetchAPIData(baseURL, queryString, renderFunction, renderSection){
    fetch(`${baseURL}${queryString}`)
    .then(response =>   {
        if (response.ok) {
            return response.json();
        } else {
          throw new Error('Oops. Something went wrong!');
        }
      })
      .then(responseJson => {
          renderFunction(responseJson)
        })
      .catch(error => {
          handleError(renderSection, error);
    })
}

function formatDateStringForNewsAPI(){
    // creates date string for 3 days ago, to be supplied as a 'From' param to news api 
    const date = new Date();
    const date1 = new Date(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
    const threeDaysAgo = new Date(date1.setDate(date1.getDate()-3));
    return `${threeDaysAgo.getFullYear()}-${threeDaysAgo.getMonth() + 1}-${threeDaysAgo.getDate()}`;
}

function getNews(){
    const baseURL = 'https://newsapi.org/v2/everything?';
    const params = {
        q: 'portland%20oregon%20OR%20(pdx)%20OR%20(97214)',
        from: formatDateStringForNewsAPI(),
        sortby: 'relevance',
        page: STORE.newsFeedPage,
        language: 'en',
        apiKey: 'ad83316ad56944b7985882d4fc4b13db'
    }
    const queryString = formatQueryParams(params);
    formatFetchAPIData(baseURL, queryString, renderNewsResults, '#news-articles')
}

function refreshNewsFeed(){
    $("#news-refresh-btn").click(function(){
        $('#news-articles').animate({scrollLeft: 0});
        STORE.newsFeedPage++
        getNews();
      });
}

function refreshPicsFeed(){
    $("#pics-refresh-btn").click(function(){
        STORE.picsFeedPage++
        getPictures();
      });
}

function getPictures(){
    const baseURL = 'https://pixabay.com/api/?';
    const params = {
        q: 'Oregon',
        image_type: 'photo',
        key: '12489219-e5303494637582631d9dae0d2',
        per_page: 21,
        page: STORE.picsFeedPage
    }
    const queryString = formatQueryParams(params);
    formatFetchAPIData(baseURL, queryString, renderPictures, '#picture-gallery')
}

function getWeather(){
    const baseURL = 'https://api.openweathermap.org/data/2.5/weather?';
    const params = {
        lat: 45.5202,
        lon: -122.6742,
        units: 'imperial',
        appid: '653c86db32d0605a0469a4863b99f2af'
    }
    const queryString = formatQueryParams(params);
    formatFetchAPIData(baseURL, queryString, renderWeatherResults, '.weather-list');
}

function getBackgroundImage(q){
    const baseURL = 'https://api.pexels.com/v1/search?';
    const params = {
        per_page: 10,
        page: 1
    }
    params.query = q;
    const queryString = formatQueryParams(params);
    return fetch(`${baseURL}${queryString}`, {
        headers: new Headers({
            "Authorization": "563492ad6f917000010000016b7a73828a0543f0860f96ea04808de5"
        })
    })
    .then(response =>   {
        if (response.ok) {
            return response.json();
        } else {
          throw new Error('Oops. Something went wrong!');
        }
      })
      .then(responseJson => {
          const randomNumber = Math.floor(Math.random() * 10)
          renderBackground(responseJson.photos[randomNumber].src.landscape)
        })
      .catch(error => {
          handleError('#picture-gallery', error);
    })   
    
}


$(
    getWeather(),
    getPictures(),
    getNews(),
    refreshPicsFeed(),
    loadingSpinner()
);
