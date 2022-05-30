const boundaryLayer = "data/ca_counties_small.geojson"
let boundary; // place holder for the data
let collected; // variable for turf.js collected points 
let allPoints = []; // array for all the data points

let mapOptions = {'center': [34.0709,-118.444],'zoom':5};

let englishFirst = L.featureGroup();
let nonEnglishFirst = L.featureGroup();

let layers = {
	"English as First Language <svg height='10' width='10'><circle cx='5' cy='5' r='4' stroke='black' stroke-width='1' fill='green' /></svg>": englishFirst,
	"Non-English as First Language <svg height='10' width='10'><circle cx='5' cy='5' r='4' stroke='black' stroke-width='1' fill='red' /></svg>": nonEnglishFirst
}

let circleOptions = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS2WyfKTyZJ-_ja3GGrxoAXwranavyDGXYsxeFUO4nvHpCJrkKhChymXQqUEyhdGLnz9VN6BJv5tOjp/pub?gid=1560504149&single=true&output=csv";

const englishFirstLegendHTML = document.getElementById("englishFirstLegend");
const nonEnglishFirstLegendHtml = document.getElementById("nonEnglishFirstLegend");

const map = L.map('the_map').setView(mapOptions.center, mapOptions.zoom);


let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
	maxZoom: 16
});

Esri_WorldGrayCanvas.addTo(map);

// for coloring the polygon
function getStyles(data){
    console.log(data)
    let myStyle = {
        "color": "#ff7800",
        "weight": 1,
        "opacity": .0,
        "stroke": .5
    };
    if (data.properties.values.length > 0){
        myStyle.opacity = 0
        
    }
    return myStyle
}

function addMarker(data){
    // this is the value that will be incremented
    let speakEnglish = data['Is your English your first language?']
    // create the turfJS point
    let thisPoint = turf.point([Number(data.lng),Number(data.lat)],{speakEnglish})
    // put all the turfJS points into `allPoints`
    allPoints.push(thisPoint)
    if(data['Is your English your first language?'] == "Yes"){
        circleOptions.fillColor = "red"
        englishFirst.addLayer(L.circleMarker([data.lat,data.lng],circleOptions).bindPopup(`<h2>English First Language</h2>`))
        createButtons(data.lat,data.lng,data.Location)
        }
    else{
        circleOptions.fillColor = "blue"
        nonEnglishFirst.addLayer(L.circleMarker([data.lat,data.lng],circleOptions).bindPopup(`<h2>Non-English First Language</h2>`))
        createButtons(data.lat,data.lng,data.Location)
    }
    return data
};

function createButtons(lat,lng,title){
    const newButton = document.createElement("button"); // adds a new button
    newButton.id = "button"+title; // gives the button a unique id
    newButton.innerHTML = title; // gives the button a title
    newButton.setAttribute("lat",lat); // sets the latitude 
    newButton.setAttribute("lng",lng); // sets the longitude 
    newButton.addEventListener('click', function(){
        map.flyTo([lat,lng]); //this is the flyTo from Leaflet
    })
    const spaceForButtons = document.getElementById('placeForButtons')
    spaceForButtons.appendChild(newButton);//this adds the button to our page.
};

function loadData(url){
    Papa.parse(url, {
        header: true,
        download: true,
        complete: results => processData(results)
    })
};

function processData(results){
    console.log(results)
    results.data.forEach(data => {
        console.log(data)
        addMarker(data)
    })
    englishFirst.addTo(map) // add our layers after markers have been made
    nonEnglishFirst.addTo(map) // add our layers after markers have been made  
    let allLayers = L.featureGroup([englishFirst,nonEnglishFirst]);
    map.fitBounds(allLayers.getBounds());
    // step 1: turn allPoints into a turf.js featureCollection
    thePoints = turf.featureCollection(allPoints)

    // step 2: run the spatial analysis
    getBoundary(boundaryLayer)
};

loadData(dataUrl)

// toggle the legend for englishFirstLegend grouplayer
englishFirstLegendHTML.addEventListener("click",toggleEnglishLayer) 

function toggleEnglishLayer(){
    if(map.hasLayer(englishFirst)){
        map.removeLayer(englishFirst)
    }
    else{
        map.addLayer(englishFirst)
    }
}

// toggle the legend for nonEnglishFirstLegend grouplayer
nonEnglishFirstLegendHtml.addEventListener("click",toggleNonEnglishLayer) 

function toggleNonEnglishLayer(){
    if(map.hasLayer(nonEnglishFirst)){
        map.removeLayer(nonEnglishFirst)
    }
    else{
        map.addLayer(nonEnglishFirst)
    }
}


//function for clicking on polygons
function onEachFeature(feature, layer) {
    console.log(feature.properties)
    if (feature.properties.values) {
        //count the values within the polygon by using .length on the values array created from turf.js collect
        let count = feature.properties.values.length
        console.log(count) // see what the count is on click
        let text = count.toString() // convert it to a string
        layer.bindPopup(text); //bind the pop up to the number
    }
}



function getBoundary(layer){
    fetch(layer)
    .then(response => {
        return response.json();
        })
    .then(data =>{
                //set the boundary to data
                boundary = data

                // run the turf collect geoprocessing
                collected = turf.collect(boundary, thePoints, 'speakEnglish', 'values');
                // just for fun, you can make buffers instead of the collect too:
                // collected = turf.buffer(thePoints, 50,{units:'miles'});
                console.log(collected.features)

                // here is the geoJson of the `collected` result:
                L.geoJson(collected,{onEachFeature: onEachFeature,style:function(feature)
                {
                    console.log(feature)
                    if (feature.properties.values.length > 0) {
                        return {color: "#ff0000",stroke: false};
                    }
                    else{
                        // make the polygon gray and blend in with basemap if it doesn't have any values
                        return{opacity:0,color:"#efefef" }
                    }
                }
                // add the geojson to the map
                    }).addTo(map)
        }
    )   
}