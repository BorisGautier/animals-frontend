import Map from 'ol/Map';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import Feature from 'ol/Feature';
import { Vector as VectorLayer } from 'ol/layer';
import VectorSource from 'ol/source/Vector.js';
import Point from 'ol/geom/Point'
import {
    fromLonLat,
} from 'ol/proj.js';
import {
    Icon,
    Stroke,
    Style,
} from 'ol/style';
import Polyline from 'ol/format/Polyline';
import { Overlay } from 'ol';

const map = new Map({
    layers: [
        new TileLayer({
            source: new XYZ({
                crossOrigin: 'anonymous',
                url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZ2F1dHk5NiIsImEiOiJjanN4aDd2cG8wMmw3NDRwaDc2cnc2OXJwIn0.YRVVo-3FkQtfkMPH4lt2hw',
            })
        })
    ],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 4,
    }),
});



const queryString = window.location.search;

const urlParams = new URLSearchParams(queryString);

const id = urlParams.get('id')

const backend_url = "http://tracking.forearthver.com/public/";

// api url
const api_url =
    backend_url + "api/animals/" + id;

// Defining async function


// Storing response
const response = await fetch(api_url);

// Storing data in form of JSON
let data = await response.json();

let coordinates = []

map.getView().fit(new Point(fromLonLat([Number(data.data.animal.longitude), Number(data.data.animal.latitude)])), {
    duration: 1000, maxZoom: 12
})

for (let index = 0; index < data.data.animal.trackings.length; index++) {
    const element = data.data.animal.trackings[index];
    let coordinate = [Number(element.lon), Number(element.lat)]
    coordinates.push(coordinate)

    let layer = new VectorLayer({
        style: new Style({
            image: new Icon({
                src: backend_url + 'storage/' + data.data.animal.medias[0].media_url,
                scale: 0.07,
            }),
        }),
        source: new VectorSource({

            features: [
                new Feature({
                    type: "tracking",
                    nom: data.data.animal.name,
                    date: element.created_at,
                    lon: element.lon,
                    lat: element.lat,
                    geometry: new Point(fromLonLat([Number(element.lon), Number(element.lat)]))
                })
            ]
        })
    });



    map.addLayer(layer);

}
let elements = [];
for (let j = 0; j < coordinates.length; j++) {
    const element = coordinates[j];

    elements.push(element);
}

let url =
    'https://router.project-osrm.org/route/v1/driving/' +
    data.data.animal.longitude +
    ',' +
    data.data.animal.latitude +
    ';' +
    elements.join(";") +

    '?overview=full';

// Storing response
const route = await fetch(url);

let dataRoute = await route.json();








let layer = new VectorLayer({
    style: new Style({
        image: new Icon({
            src: backend_url + 'storage/' + data.data.animal.medias[0].media_url,
            scale: 0.07,
        }),
    }),
    source: new VectorSource({

        features: [
            new Feature({
                type: "tracking",
                nom: data.data.animal.name,
                date: data.data.animal.created_at,
                lon: data.data.animal.longitude,
                lat: data.data.animal.latitude,
                geometry: new Point(fromLonLat([Number(data.data.animal.longitude), Number(data.data.animal.latitude)]))
            })
        ]
    })
});



map.addLayer(layer);

let routeLine = new Polyline({
    factor: 1e5,
}).readGeometry(dataRoute.routes[0].geometry, {
    dataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
});

const routeFeature = new Feature({
    type: 'route',
    geometry: routeLine,
});


const styles = {
    'route': new Style({
        stroke: new Stroke({
            width: 3,
            color: data.data.animal.couleur,
        }),
    }),

};

const vectorLayerRoute = new VectorLayer({
    source: new VectorSource({
        features: [routeFeature,],
    }),
    style: function (feature) {
        return styles[feature.get('type')];
    },
});

map.addLayer(vectorLayerRoute);

document.getElementById("name").innerHTML = data.data.animal.name;
document.getElementById("title").innerHTML = data.data.animal.title;
document.getElementById("sexe").innerHTML = data.data.animal.sexe;

document.getElementById("localisation").innerHTML = data.data.animal.localisation;

let date = new Date(data.data.animal.date_naissance)
let ageDifMs = Date.now() - date.getTime();
let ageDate = new Date(ageDifMs); // miliseconds from epoch
let age = Math.abs(ageDate.getUTCFullYear() - 1970);

document.getElementById("age").innerHTML = age + ' years';

document.getElementById("description").innerHTML = data.data.animal.description;
document.getElementById("habitat").innerHTML = data.data.animal.habitat;
document.getElementById("menaces").innerHTML = data.data.animal.menaces;
document.getElementById("funfact").innerHTML = data.data.animal.funfact;

document.getElementById("class").innerHTML = data.data.animal.classe;
document.getElementById("order").innerHTML = data.data.animal.order;
document.getElementById("family").innerHTML = data.data.animal.family;
document.getElementById("diet").innerHTML = data.data.animal.diet;

const img = document.querySelectorAll("img");
img[1].src = backend_url + "storage/" + data.data.animal.medias[0].media_url;
img[0].src = backend_url + "storage/" + data.data.animal.cover_url;

map.on('click', function (evt) {
    map.forEachFeatureAtPixel(evt.pixel, function (layer) {
        if (layer.get('type') == "tracking") {
            let container = document.getElementById('popup');
            let content = document.getElementById('popup-content');
            let closer = document.getElementById('popup-closer');
            container.style.display = 'inline';
            let overlay = new Overlay({
                element: container,
                autoPan: true,
                autoPanAnimation: {
                    duration: 250,
                },
            });

            closer.onclick = function () {
                overlay.setPosition(undefined);
                closer?.blur();
                return false;
            };
            map?.addOverlay(overlay);

            let coordinate = evt.coordinate;

            content.innerHTML =
                '<p><b>Nom : </b>' +
                layer.get('nom') +
                '</p>' +
                '<p><b>Position : </b>' +
                layer.get('lon') + ',' + layer.get('lat') +
                '</p>' +
                '<p><b>Date : </b>' +
                layer.get('date').split('T')[0];
            overlay.setPosition(coordinate);

        } else {
            container.style.display = 'inline';
        }
    });
});