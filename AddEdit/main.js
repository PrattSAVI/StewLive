// Run on PORT:51922
// Add URL here until final: https://developers.arcgis.com/applications/a35c717e2a2b4ee485a425379a4da7e0/

import { config } from "./config.js";

// Enter you local host url to Developper Auto 2.0 in ArcGIS Developper account.
// All Survey Info comes from Config
var esri_key = config.esri_key;
var clientId = config.clientId;
var itemId = config.itemId;
var fl = config.fl_url;
var nonp_url = config.nonp_url;

require(["esri/config", "esri/views/MapView", "esri/Map", "esri/WebMap", "esri/layers/FeatureLayer"], (esriConfig, MapView, Map, WebMap, FeatureLayer) => {

    // ----------- BUTTONS FOR SURVEYS -----------------
    const add_button = document.getElementById("add-group");
    add_button.addEventListener("click", () => {
        console.log("Initiate Survey -> Add Group")

        //This is the Survey123 -- Add
        document.getElementById("formDiv").setAttribute("style", "height:100%");
        document.getElementById("formDiv-edit").setAttribute("style", "height:1px");

        var webform = new Survey123WebForm({
            clientId: clientId, // Oath only is allowed in local host 50905 for now.
            container: "formDiv",
            itemId: itemId,
            autoRefresh: 3,
            //isDisabedSubmittoFeatureService: false,
            hideElements: ["theme", "navbar", "header", "footer", "description"], // Hide cosmetic elements
            onFormLoaded: (data) => { // Place point to current location
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(position => {
                        webform.setGeopoint({
                            x: position.coords.longitude,
                            y: position.coords.latitude
                        });
                    }, () => {
                        //console.error('Unable to retrieve your location');
                        webform.setGeopoint({
                            // If current location is not know, go to the center
                            x: -110.2425,
                            y: 43.925
                        });
                    });
                } else {
                    console.error('Geolocation is not supported by your browser');
                }
            },
            onFormSubmitted: (data) => { // Show me the submitted data
                console.log("Data Submitted")
                    //console.log(data.surveyFeatureSet.features[0].attributes)
                    //console.log(data.surveyFeatureSet.features[0].geometry)
            }
        })
    });

    esriConfig.apiKey = esri_key;

    // -------- SURVEY RESPONSES ----------
    // Pop up Template
    var template_groups = {
        // autocasts as new PopupTemplate()
        title: "Clicked Group",
        content: "Name: {group_name} <br> Public: {_public}"
    };

    //Connect to Group Data as feature layer
    const layer = new FeatureLayer({
        url: fl,
        outFields: ["group_name", "_public"],
        popupTemplate: template_groups
    });

    // -------- 990 GROUPS DISPLAYED HERE ---------
    //Layer Styling is here
    let renderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: {
            type: "simple-marker", // autocasts as new SimpleFillSymbol()
            color: [125, 125, 125, 0.3],
            size: 4,
            outline: { // autocasts as new SimpleLineSymbol()
                width: 0, // No outline
            }
        }
    };

    var template_nonp = { // Non profits Pop-up
        // autocasts as new PopupTemplate()
        //title: "Clicked Group",
        content: "EIN: {EIN} <br> Group Name: {NAME}"
    };

    //Connect to 990 groups, Make a Feature Layer
    const nonp = new FeatureLayer({
        url: nonp_url,
        outFields: ["EIN", "NAME", "STREET", "CITY", "STATE"],
        renderer: renderer,
        popupTemplate: template_nonp
    });


    // ----- BASEMAP HERE------
    const myMap = new Map({
        basemap: "osm",
        layers: [layer, nonp] // Non-profits and stew-map layer
    });

    // Create a MapView instance (for 2D viewing) and reference the map instance
    let view = new MapView({
        map: myMap,
        container: "viewDiv",
        zoom: 5,
        center: [-110.2425, 43.925]
    });

    // -------- INTERACTIONS
    // Get the screen point from the view's click event
    view.on("click", (event) => {
        view.hitTest(event.screenPoint, { include: nonp })
            .then(function(response) {
                if (response.results.length > 0) {
                    var graphic = response.results.filter(function(result) { // check if the graphic belongs to the layer of interest
                        return result.graphic.layer === nonp;
                    })[0].graphic; // do something with the result graphic
                    console.log(graphic.attributes.EIN);

                    // Scroll the info element to clicked group
                    nonp.queryFeatures({
                        where: `EIN = '${graphic.attributes.EIN}'`,
                        outFields: ['*']
                    }).then(function(results) {
                        // prints an array of all the features in the service to the console
                        console.log(results.features[0].attributes);
                        injectList(results)
                    });

                }
            });
    })

    // -------------------- INPUT ------------------------
    //Convert text to title case
    function titleCase(str) {
        str = str.toLowerCase().split(' ');
        for (var i = 0; i < str.length; i++) {
            str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
        }
        return str.join(' ');
    }

    //Everything about the group-list is here
    function injectList(results) {

        // Inject List Controls the right panel elements 
        /*
        0. Empty the Group List
        1. Sort List
        2. For Loop Elements and insert Group Name and Address
        3. Add "Edit This Group" button at the bottom
        4. When Edit button is clicked, launch a new survey in edit mode at the side.
        */

        //Empty the div
        document.getElementById("group-list").innerHTML = "";
        console.log(`There are ${results.features.length} groups in the list`)
            //Sort List
        results.features.sort((a, b) => a.attributes.NAME > b.attributes.NAME ? 1 : -1);

        //Ierate over each element to generate the list
        results.features.forEach(function(feat) {
            // ----- Insert Name and Address
            var htmlString = `<p style="font-size:10pt" class="group-content">${titleCase(feat.attributes.NAME)}</p><p style="font-size:8pt" class="group-content">${titleCase(feat.attributes.address)}</p>`;
            //var button = `<div style="margin:auto;height:10px;width:45px;background-color:green" class="edit-button" id="edit-${feat.attributes.EIN}"></div>`
            let div = document.createElement('div');
            div.setAttribute("id", `${feat.attributes.EIN}`);
            div.setAttribute("class", "group-container");
            div.innerHTML = htmlString;
            document.getElementById("group-list").appendChild(div);

            // ----- Button in each group element
            let button = document.createElement('div');
            button.setAttribute("id", `${feat.attributes.EIN}`);
            button.setAttribute("class", "edit-button");
            button.setAttribute("style", "text-align:center;width:150px;background-color:green;margin:auto;font-size:9pt;margin-top:3px;padding:2px 2px 2px 2px;cursor:pointer");
            button.innerHTML = `<p style="pointer-events:none;">Edit This Group</p>`;

            // ----- On click
            button.addEventListener("click", function change(event) {
                    //console.log(event.target.attributes.id.value)

                    // Query group by EIN to get GlobalID
                    nonp.queryFeatures({
                        where: `EIN = ${event.target.attributes.id.value}`,
                        outFields: ['*']
                    }).then(function(results) {
                        console.log(`GlobalID ${results.features[0].attributes.GlobalID}`) // This is the GlobalID
                        let web_link = `https://survey123.arcgis.com/share/9b2e09518465481ab0359755008ceab4?mode=edit&globalId=${results.features[0].attributes.GlobalID}`
                        console.log(web_link);

                        //--------------------------- Insert Webform to formDiv-edit in Edit Mode
                        // Example web URL: https://survey123.arcgis.com/share/9b2e09518465481ab0359755008ceab4?mode=edit&globalId=d2491909-52eb-4f1d-b845-1ec46567f1e8
                        //window.open(web_link, '_blank');


                        //document.getElementById("formDiv-edit").innerHTML = `<iframe src=${web_link}>` //Try Iframe
                        document.getElementById("formDiv-edit").setAttribute("style", "height:100%");
                        document.getElementById("formDiv").setAttribute("style", "height:1px");

                        var webform_edit = new Survey123WebForm({
                            clientId: clientId, // Oath only is allowed in local host 50905 for now.
                            container: "formDiv-edit",
                            itemId: "9b2e09518465481ab0359755008ceab4",
                            width: 250,
                            autoRefresh: 3,
                            //isDisabedSubmittoFeatureService: false,
                            hideElements: ["theme", "navbar", "header", "footer", "description"], // Hide cosmetic elements
                        })
                        webform_edit.setMode({
                            mode: 'edit',
                            globalId: `${results.features[0].attributes.GlobalID}`
                        })


                    });
                })
                // On Click Finishes Here
            div.appendChild(button); // Add edit button to the end of div
        })
    }

    // Queries for all the features in the service (not the graphics in the view)
    nonp.queryFeatures().then(function(results) {
        // prints an array of all the features in the service to the console
        console.log(results.features[0].attributes);
        injectList(results)
    });

    //When there is input, what do do.
    document.getElementById("group-search").addEventListener("input", function change(event) { //if there is change

        if (event.target.value) { //If the input exists
            //Write this stupid SQL query to search the database
            nonp.queryFeatures({
                where: `NAME LIKE '%${event.target.value.toUpperCase()}%'`,
                outFields: ['*']
            }).then(function(results) {
                injectList(results);
            });
        } else { //If the input is empty, then run with all the values. 
            nonp.queryFeatures().then(function(results) {
                // prints an array of all the features in the service to the console
                injectList(results)
            });
        }

    });

});