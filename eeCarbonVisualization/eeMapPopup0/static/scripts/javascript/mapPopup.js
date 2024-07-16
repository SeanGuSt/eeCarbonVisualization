//Placeholder constants
const BCOLOR = ["black", "pink", "orange", "blue", "green", "yellow"];//List of colors for the layers of the bar graph
const X_AXIS_DEFAULT_TEXT = "Site ID: ";
const map = L.map('map').setView(init_geo, 2);
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
var circlearray = [];
circles.forEach(function (circle, index) {
var onecircle =  L.circle(circle, {
    color: "red",
    fillColor: "#f03",
    fillOpacity: 0.8,
    radius: 8000,//Radius in feet. Definitely needs to be changed.
        }).addTo(map).bindPopup();
onecircle.bindTooltip(sites[index]);
circlearray.push(onecircle);//Future proofing, on the off chance we need a list of the markers.
});
var soilLayerBarChart = null;//Initial chart curve.
//chartId is a janky method of making the bar graphs easier to handle.
//Without this, the user would need to fully close each popup they opened before opening a new one,
//otherwise they would get an empty popup.
var chartId = 0;
map.on('popupopen', function(e) {
    $.ajax({                       // initialize an AJAX request
        url: myUrl,  // set the url of the request (= localhost:8000/base/load-params/)
        data: {
            "site" : e.popup._source.getTooltip()._content       // add the country id to the GET parameters
        },
        success: function (data) {
            if(soilLayerBarChart != null){
                soilLayerBarChart.destroy();
            }
            const popupGraph = `<div class="graphViewer-grid-biggraph"><canvas id="soilLayerBarChart`+chartId+`" width="560" height="315"></canvas></div>`;
            e.popup._source.bindPopup(popupGraph);
            const defaultScales = {
                x: {
                    type: "category",
                    stacked: true,
                    offset: true,
                    title: {
                        display: true,
                        text: X_AXIS_DEFAULT_TEXT,
                        color: "black",
                        font: {
                            size: 14
                        }
                    },
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Distance Underground (cm)"
                    }
                },
            };
            const DATASET_BAR_GRAPH = 1;
            var dataCurve = {datasets: [{type: 'bar'}]};
            var configCurve = {
                maintainAspectRatio: false,
                scales: defaultScales,
                plugins: {
                    legend: {
                        display: false
                    }
                },
            };
            var ctx = document.getElementById("soilLayerBarChart"+chartId).getContext("2d");
            soilLayerBarChart = new Chart(ctx, {
                // The type of chart we want to create
                type: "bar",
                // The data for our dataset
                data: dataCurve,
                //The configuration details for our graph
                options: configCurve
            });
            var cdd = soilLayerBarChart.data.datasets;//cdd short for chart data datasets
            const footer_keys = data.footer_keys;
            const footer_values = data.footer_values;
            const footer = (tooltipItems) => {
                let footer_lines = [];
                tooltipItems.forEach(function(tooltipItem) {//For each layer of soil data
                    for(let i = 0; i < footer_keys.length; i++){//For each string in footer_keys
                        //have the following string show up.
                        footer_lines.push(footer_values[i] + ": " + 
                            cdd[tooltipItem.datasetIndex-1]
                               [footer_keys[i]]
                               [tooltipItem.dataIndex]);
                            //The above in full is cdd[tooltipItem.datasetIndex-1][footer_keys[i]][tooltipItem.dataIndex]
                    }
                });
                return footer_lines;
            };
            soilLayerBarChart.options.scales.x.title.text = X_AXIS_DEFAULT_TEXT + data.site;//Set x-axis label
            soilLayerBarChart.options.plugins.tooltip.callbacks.footer = footer;//Set the footers.
            for(let layer_num = 0; layer_num < data.layer_.length; layer_num++){
                var newDataset = {
                    data: data.data[layer_num],
                    type : "bar",
                    label : "Layer " + data.layer_[layer_num],
                    backgroundColor : BCOLOR[layer_num % BCOLOR.length]
                };
                for (let i = 0; i < footer_keys.length; i++){cdd[layer_num][footer_keys[i]] = data[footer_keys[i]][layer_num];}
                cdd.push(newDataset);
            }
            for(let i = 1; i <= cdd[DATASET_BAR_GRAPH].data.length; i++){soilLayerBarChart.data.labels.push("Sample " + i);}
            soilLayerBarChart.update();
            //If the chartId is 1, set it to 0. If 0, set it to 1.
            //This allows us to change bar charts easily. My best guess as to why it works is it... allows the old chart time to replace the stuff it had?
            //I said it was my best guess, not a good one.
            //To see the problem with bar charts not appearing, simply comment out the line below.
            chartId = chartId == 1 ? 0 : 1;
        }
    });
});