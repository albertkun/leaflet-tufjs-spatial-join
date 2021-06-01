const map = L.map('map').setView([34.0709, -118.444], 5);

const url = "https://spreadsheets.google.com/feeds/list/1upD99bKWIO68jL8MKWV67KE-_H_TVn2bCwqyQkqNsBw/oxw5dh3/public/values?alt=json"

let Esri_WorldGrayCanvas = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
	maxZoom: 16
});

Esri_WorldGrayCanvas.addTo(map)

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

fetch(url)
	.then(response => {
		return response.json();
		})
    .then(data =>{
                // console.log(data)
                formatData(data)
        }
)

let speakFluentEnglish = L.featureGroup();
let speakOtherLanguage = L.featureGroup();

let exampleOptions = {
    radius: 4,
    fillColor: "#ff7800",
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
};

let allLayers;


const boundaryLayer = "../data/ca_counties.geojson"
let boundary;
let ptsWithin;
let collected;
let allPoints = [];
function onEachFeature(feature, layer) {
    // does this feature have a property named popupContent?
    console.log(feature.properties)
    if (feature.properties.values) {
        let count = feature.properties.values.length
        console.log(count)
        let text = count.toString()
        layer.bindPopup(text);
    }
}

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

function getBoundary(layer){
    fetch(layer)
    .then(response => {
        return response.json();
        })
    .then(data =>{
                boundary = data
                collected = turf.collect(boundary, thePoints, 'speakEnglish', 'values');
                // collected = turf.buffer(thePoints, 50,{units:'miles'});
                console.log(collected.features)
                L.geoJson(collected,{onEachFeature: onEachFeature,style:function(feature)
                {
                    console.log(feature)
                    if (feature.properties.values.length > 0) {
                        return {color: "#ff0000",stroke: false};
                    }
                    else{
                        return{opacity:0}
                    }
                }
                    }).addTo(map)
        }
    )   
}

console.log(boundary)

function addMarker(data){
    let speakEnglish = data.doyouspeakenglishfluently
    let thisPoint = turf.point([Number(data.lng),Number(data.lat)],{speakEnglish})
    allPoints.push(thisPoint)
    if(data.doyouspeakenglishfluently == "Yes"){
        exampleOptions.fillColor = "green"
        speakFluentEnglish.addLayer(L.circleMarker([data.lat,data.lng],exampleOptions).bindPopup(`<h2>Speak English fluently</h2>`))
        createButtons(data.lat,data.lng,data.location)
        }
    else{
        exampleOptions.fillColor = "red"
        speakOtherLanguage.addLayer(L.circleMarker([data.lat,data.lng],exampleOptions).bindPopup(`<h2>Speak other languages</h2>`))
        createButtons(data.lat,data.lng,data.location)
    }
    return data.timestamp
}

function createButtons(lat,lng,title){
    const newButton = document.createElement("button");
    newButton.id = "button"+title;
    newButton.innerHTML = title;
    newButton.setAttribute("lat",lat); 
    newButton.setAttribute("lng",lng);
    newButton.addEventListener('click', function(){
        map.flyTo([lat,lng]);
    })
    const spaceForButtons = document.getElementById('contents')
    spaceForButtons.appendChild(newButton);
}

function formatData(theData){
        const formattedData = []
        const rows = theData.feed.entry
        for(const row of rows) {
          const formattedRow = {}
          for(const key in row) {
            if(key.startsWith("gsx$")) {
                  formattedRow[key.replace("gsx$", "")] = row[key].$t
            }
          }
          formattedData.push(formattedRow)
        }
        console.log(formattedData)
        console.log('boundary')
        console.log(boundary)
        formattedData.forEach(addMarker)
        speakFluentEnglish.addTo(map)
        speakOtherLanguage.addTo(map)
        
        allLayers = L.featureGroup([speakFluentEnglish,speakOtherLanguage]);
        thePoints = turf.featureCollection(allPoints)
        console.log(thePoints)
        getBoundary(boundaryLayer)
        console.log('boundary')
        console.log(boundary)
        map.fitBounds(allLayers.getBounds());   
}
let layers = {
	"Speaks English": speakFluentEnglish,
	"Speaks Other Languages": speakOtherLanguage
}

L.control.layers(null,layers).addTo(map)


collected.features.properties.values


