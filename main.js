let fl_url = "https://services1.arcgis.com/gGHDlz6USftL5Pau/arcgis/rest/services/service_8a7f4dd5ead5437594813e8983d7be98/FeatureServer/0";

require(["esri/config", "esri/views/MapView", "esri/Map", "esri/WebMap", "esri/layers/FeatureLayer"], (esriConfig, MapView, Map, WebMap, FeatureLayer) => {

    esriConfig.apiKey = "AAPK2e6f6235b63e4b53a08da4f04dc20b93BbuNAZ9o1yNKUN5Qgf2k8QykIDjHmdEyvvtYGXGoDcoWONg06lMrGiHkpdxKv5-Q";

    // Pop up Template
    var template = {
        // autocasts as new PopupTemplate()
        title: "Clicked Group",
        content: "<strong>Name: </strong>{OrgName}" + "\n"
    };

    //Connect to Data and Display
    const layer = new FeatureLayer({
        url: fl_url,
        outFields: ["*"],
        popupTemplate: template
    });

    const myMap = new Map({
        basemap: "osm",
        layers: [layer]
    });

    // Create a MapView instance (for 2D viewing) and reference the map instance
    let view = new MapView({
        map: myMap,
        container: "viewDiv",
        zoom: 5,
        center: [-110.2425, 43.925]
    });

    var webform = new Survey123WebForm({
        clientId: "PHntZUXswx2hhkP0", // Oath only is allowed in local host 50905 for now.
        container: "formDiv",
        itemId: "f844baf501dc49988f795a3f19c00857",
        hideElements: ["navbar", "header", "footer"], // Hide cosmetic elements
        onFormLoaded: (data) => { // Place point to current location
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    webform.setGeopoint({
                        x: position.coords.longitude,
                        y: position.coords.latitude
                    });
                }, () => {
                    //console.error('Unable to retrieve your location');
                    webform.setGeopoint({ // If current location is not know, go to the center
                        x: -110.2425,
                        y: 43.925
                    });
                });
            } else {
                console.error('Geolocation is not supported by your browser');
            }
        },
        onFormSubmitted: (data) => { // Show me the submitted data
            console.log(data.surveyFeatureSet.features[0].attributes)
            console.log(data.surveyFeatureSet.features[0].geometry)
        }


    })
});