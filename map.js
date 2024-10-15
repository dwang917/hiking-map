require([
  "esri/config",
  "esri/Map",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/widgets/BasemapToggle",
  "esri/widgets/LayerList",
  "esri/widgets/Legend",
  "esri/widgets/DirectLineMeasurement3D",
  "esri/widgets/Search",
  "esri/widgets/Expand",
  "esri/widgets/Slider",
  "esri/widgets/ElevationProfile",
],
  function (
    esriConfig,
    Map,
    SceneView,
    FeatureLayer,
    BasemapToggle,
    LayerList,
    Legend,
    DirectLineMeasurement3D,
    Search,
    Expand,
    Slider,
    ElevationProfile,
  ) {

    esriConfig.apiKey = "";



    const scene = new Map({
      basemap: "arcgis-topographic",
      ground: "world-elevation"
    });

    const view = new SceneView({
      container: "viewDiv",
      map: scene,
      popup: {
        dockEnabled: true,
        dockOptions: {
          position: "bottom-right",
          breakpoint: false
        }
      },
      camera: {
        position: [-107.8123, 37.89, 6000],
        tilt: 65
      }
    });



    const popupTrail = {
      title: "{NAME}",
      //content: "Name: {NAME}<br>Use: {USES}<br>Length: {MILES} miles"
      content: [
        {
          type: "text", // TextContentElement
          text: "Name: {NAME}<br>Use: {USES}<br>Mileage: {MILES} miles<br>Difficulty: {Difficulty}<br>Elevation Gain: {ELEV_GAIN} ft<br>"
        },

        {
          type: "custom",
          creator: showElev
        }
      ]
    }

    const trailsLayer = new FeatureLayer({
      url: "https://services9.arcgis.com/FF3qnCUixr5w9JQi/arcgis/rest/services/SanMiguelTrails_DW/FeatureServer",
      popupTemplate: popupTrail,
      outFields: ["*"],
      title: "San Miguel County Trails"
    });

    var trailsLayerView;

    view.whenLayerView(trailsLayer).then((layerView) => {
      trailsLayerView = layerView;
    })

    scene.add(trailsLayer);





    const trailheadsRenderer = {
      "type": "simple",
      "symbol": {
        "type": "picture-marker",
        "url": "http://static.arcgis.com/images/Symbols/NPS/npsPictograph_0231b.png",
        "width": "18px",
        "height": "18px"
      }
    }

    const popupTrailhead = {
      "title": "{name}",
      "content": "<b>Bathroom:</b> {bathrooms}<br><b>Fee:</b> {fee}<br><b>Water:</b> {water}<br><b>Manager:</b> {manager}"
    }

    const trailheadLayer = new FeatureLayer({
      url: "https://services1.arcgis.com/82YxYqy3f0s2D9c4/ArcGIS/rest/services/Trailheads_COTREX02172021/FeatureServer/0",
      renderer: trailheadsRenderer,
      popupTemplate: popupTrailhead,
      definitionExpression: "manager = 'San Miguel County' OR manager = 'Town of Telluride' OR manager = 'USFS Norwood Ranger District'",
      title: "Trailheads",
    });
    scene.add(trailheadLayer, 1);





    const wildernessRenderer = {
      "type": "simple",
      "symbol": {
        "color": "#A5D9B3",
        "type": "simple-fill",
        "style": "solid",
        "outline": {
          "style": "none"
        }
      }
    }

    const popupWilderness = {
      "title": "{NAME}",
      "content": [
        {
          type: "text",
          text: "<b>Agency:</b> {Agency}<br><b>Acreage:</b> {Acreage}<br><b>Website</b> <a href = {URL}>more info</a><br>"
        },
        {
          type: "media",
          mediaInfos: [{
            type: "image", 
            value: {
              sourceURL: "{ImagePath}"
            }
          }]
        }
      ]
    }

    const wildernessLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/ofxOrPgqBzEDNRBn/ArcGIS/rest/services/Wilderness/FeatureServer/0",
      outFields: ["*"],
      popupTemplate: popupWilderness,
      renderer: wildernessRenderer,
      title: "Wilderness Areas"
    });
    scene.add(wildernessLayer, 0);






    const basemapToggle = new BasemapToggle({
      view: view,
      nextBasemap: "arcgis-imagery",
    });

    view.ui.add(basemapToggle, "top-right", position = { index: 1 });

    const layerlist = new LayerList({
      view: view,
      layers: [{ layer: trailheadLayer, title: "Trailheads layer" }],
    });

    const layerlistExpand = new Expand({
      view: view,
      expandIconClass: "esri-icon-layers",
      content: layerlist,
    })

    view.ui.add(layerlistExpand, { position: "top-right", index: 2 });

    const legend = new Legend({
      view: view,
      layerInfos: [{
        layer: trailsLayer,
        title: "San Miguel County Hiking Trails"
      }]
    })

    view.ui.add(legend, "bottom-left");

    const searchWidget = new Search({
      view: view,
      autoSelect: true,
      includeDefaultSources: false,
      popupEnabled: true,
      allPlaceholder: "Search for trails",
    });
    const source = [
      {
        layer: trailsLayer
      }];
    searchWidget.sources = source;
    view.ui.add(searchWidget, { position: "top-right", index: 0 });



    var listExpand = new Expand({
      expandIconClass: "esri-icon-layer-list"
    });
    view.ui.add(listExpand, "top-left");

    async function addToList() {
      const li = document.createElement("ul");
      li.id = "list";
      const frag = document.createDocumentFragment();

      const query = trailsLayer.createQuery();
      query.orderByFields = ["NAME"]

      const results = await trailsLayer.queryFeatures(query);
      graphics = results.features;

      graphics.forEach((item, index) => {
        const attributes = item.attributes;
        const name = attributes.NAME;
        var trail = document.createElement("li");
        trail.textContent = name;
        trail.id = "block";
        trail.addEventListener("click", () => {
          view.goTo(item);
          view.popup.open({
            features: [item],
            updateLocationEnabled: true
          });
        })
        frag.appendChild(trail);
      }),

        li.appendChild(frag);
      listExpand.content = li;
    };


    addToList();






    const filterPanel = document.createElement("div");
    filterPanel.id = "filter";
    const filterExpand = new Expand({
      expandIconClass: "esri-icon-filter",
      content: filterPanel,
    })
    view.ui.add(filterExpand, "top-right");


    const DistanceSlider = document.createElement('div');
    DistanceSlider.id = 'sliderDiv';

    const slider = new Slider({
      container: DistanceSlider,
      min: 0,
      max: 10,
      values: [0, 10],
      labelsVisible: true,
      visibleElements: {
        labels: true,
        rangeLabels: true
      },
      precision: 0
    });

    slider.when(() => {
      slider.maxLabelElement.textContent = "10+";
    })

    slider.labelFormatFunction = function (value) {
      if (value == slider.max) {
        return "10+"
      }
      else {
        return value
      }
    }

    slider.tickConfigs = [{
      mode: "count",
      values: 11
    }];


    const elevSlider = document.createElement('div');
    elevSlider.id = 'sliderDiv';

    const elevationslider = new Slider({
      container: elevSlider,
      min: 0,
      max: 3000,
      values: [0, 3000],
      labelsVisible: true,
      visibleElements: {
        labels: true,
        rangeLabels: true
      },
      precision: 0
    });

    elevationslider.when(() => {
      elevationslider.maxLabelElement.textContent = "3k+";
    })

    elevationslider.labelFormatFunction = function (value) {
      if (value == elevationslider.max) {
        return "3000+"
      }
      else {
        return value
      }
    }

    elevationslider.tickConfigs = [{
      mode: "count",
      values: 10
    }];


    const difficultyDiv = document.getElementById("difficultyDiv")

    const difficultyDivCopy = difficultyDiv.cloneNode([true])
    difficultyDivCopy.style.display = "inline"
    filterPanel.appendChild(difficultyDivCopy);

    const easyBox = difficultyDivCopy.childNodes[3]
    const moderateBox = difficultyDivCopy.childNodes[8]
    const difficultBox = difficultyDivCopy.childNodes[13]



    const applyBtn = document.createElement("button")
    applyBtn.id = "filterButton"
    applyBtn.textContent = "Apply"

    applyBtn.addEventListener("click", filterDistance)

    var boxDefinition = ""
    var rangeDefinition = ""
    var elevDefinition = ""
    function filterDistance() {
      var count = 0;
      boxDefinition = ""
      rangeDefinition = ""
      elevDefinition = ""
      if (easyBox.checked) {
        if (count == 0) {
          boxDefinition += " AND (Difficulty = 'Easy'";
          count++;
        }
        else {
          boxDefinition += " OR Difficulty = 'Easy'"
        }
      }

      if (moderateBox.checked) {
        if (count == 0) {
          boxDefinition += " AND (Difficulty = 'Moderate'";
          count++;
        }
        else {
          boxDefinition += " OR Difficulty = 'Moderate'"
        }
      }

      if (difficultBox.checked) {
        if (count == 0) {
          boxDefinition += " AND (Difficulty = 'Difficult'";
        }
        else {
          boxDefinition += " OR Difficulty = 'Difficult'"
        }
      }
      if (boxDefinition != "") {
        boxDefinition += ")"
      }

      if (slider.max == slider.values[1]) {
        rangeDefinition += "Length >= '" + slider.values[0] + "'"
      } else {
        rangeDefinition += "Length >= '" + slider.values[0] + "' AND  Length <= '" + slider.values[1] + "'"
      }

      if (elevationslider.max == elevationslider.values[1]) {
        elevDefinition += " AND ELEV_GAIN >= '" + elevationslider.values[0] + "'"
      } else {
        elevDefinition += " AND ELEV_GAIN >= '" + elevationslider.values[0] + "' AND  ELEV_GAIN <= '" + elevationslider.values[1] + "'"
      }

      console.log(rangeDefinition + elevDefinition + boxDefinition)

      trailsLayerView.filter = {
        where: rangeDefinition + elevDefinition + boxDefinition
      }
      updateList()
    }





    const clearBtn = document.createElement("button")
    clearBtn.id = "clearButton"
    clearBtn.textContent = "Clear"
    clearBtn.addEventListener("click", () => {
      easyBox.checked = false;
      moderateBox.checked = false;
      difficultBox.checked = false;
      trailsLayerView.filter = null
      slider.values = [slider.min, slider.max]
      elevationslider.values = [elevationslider.min, elevationslider.max]
      addToList()
    })






    const distanceHeader = document.createElement('h3');
    distanceHeader.textContent = "Mileage (miles): ";
    distanceHeader.classList.add('heading');

    const elevationHeader = document.createElement('h3');
    elevationHeader.textContent = "Elevation Gain (ft): ";
    elevationHeader.classList.add('heading');




    filterPanel.appendChild(distanceHeader);
    filterPanel.appendChild(DistanceSlider);
    filterPanel.appendChild(elevationHeader)
    filterPanel.appendChild(elevSlider)
    filterPanel.appendChild(applyBtn)
    filterPanel.appendChild(clearBtn)
    /*slider.inputCreatedFunction = function (input, type, index) {
      input.setAttribute("type", "number");
      input.setAttribute("pattern", "[0-9]*");
    };*/





    //elevation widget in popops
    var elev;
    function showElev(feature) {
      var elevDiv = document.createElement("div");

      elevDiv.id = "DD"

      elev = new ElevationProfile({
        container: elevDiv,
        view: view,
        profiles: [{
          // displays elevation values from the input line graphic
          type: "ground", //autocasts as new ElevationProfileLineInput()
        }],
        input: feature.graphic,
        visibleElements: {
          sketchButton: false,
          selectButton: false
        },
        unitOptions: ["imperial", "metric"],
        unit: "imperialf"
      })

      return elevDiv
      //console.log(elev.isFullfilled())
    }

    view.popup.watch("visible", (visible) => {
      if (visible == false) {
        if (elev != null) {
          elev.destroy();
        }
      }
    })

    view.popup.watch("selectedFeature", () => {
      if (elev != null) {
        elev.destroy();
      }
    })




    //measurement widget

    var me;

    var meaEx = new Expand({
      view: view,
      expandIconClass: "esri-icon-measure-line"
    });

    meaEx.watch("expanded", (expanded) => {
      if (expanded == true) {
        me = new DirectLineMeasurement3D({
          view: view
        })
        meaEx.content = me;
      }
      else {
        me.destroy();
      }
    })

    view.ui.add(meaEx, "top-right");

    async function updateList() {
      const li = document.createElement("ul");
      li.id = "list";
      const frag = document.createDocumentFragment();

      const results = await trailsLayerView.queryFeatures({
        where: rangeDefinition + elevDefinition + boxDefinition,
        orderByFields: ["NAME"],
        returnGeometry: true
      })
      graphics = results.features;

      graphics.forEach((item) => {
        const attributes = item.attributes;
        const name = attributes.NAME;
        var trail = document.createElement("li");
        trail.textContent = name;
        trail.id = "block";
        trail.addEventListener("click", () => {
          view.goTo(item);
          view.popup.open({
            features: [item],
            updateLocationEnabled: true
          });
        })
        frag.appendChild(trail);
      }),

        li.appendChild(frag);
      listExpand.content = li;
    }


    // filterExpand.watch("expanded", (expanded) => {
    //   if (expanded == true) {
    //     setTimeout(function(){difficultyDiv.style.display = "inline"}, 110);
    //   }
    //   else {
    //     difficultyDiv.style.display = "none"
    //   }
    // })


    /*
    Calculating elevation gain and update the fields, only ran once
    */

    // const query = trailsLayer.createQuery();
    // query.returnGeometry = true

    // trailsLayer.queryFeatures(query).then((feaSet) => {
    //   graphics = feaSet.features;

    //   graphics.forEach((item) => {
    //     const editFeature = item;
    //     const elevationPromise = scene.ground.queryElevation(item.geometry)
    //     let ascent = 0;
    //     elevationPromise.then((result) => {
    //       const path = result.geometry.paths[0];

    //       for (let i = 1; i < path.length; i++) {
    //         const d = path[i][2] - path[i - 1][2];
    //         if (d > 0) {
    //           ascent += d;
    //         }
    //       }
    //       ascent = ascent * 3.28084;
    //       editFeature.attributes["ELEV_GAIN"] = ascent;
    //       const edits = {updateFeatures: [editFeature]}
    //       trailsLayer.applyEdits(edits).then()
    //     });
    //   });
    // })

  });
