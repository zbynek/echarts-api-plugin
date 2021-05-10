/* global echarts, bootstrap5, EChartsJenkinsApi */
/**
 * Renders a trend chart in the specified div using ECharts.
 *
 * @param {String} chartDivId - the ID of the div where the chart should be shown in
 * @param {String} enableLinks - determines if the chart is clickable. If the chart is clickable, then clicking on a
 *     chart will open the results of the selected build.
 * @param {String} configurationId - ID of the div-element that renders a configuration dialog of this trend chart.
 If this element is defined, then the trend chart will use a configuration button that
 will invoke the specified element. If your trend has no special configuration dialog
 then the ID "defaultTrendConfiguration" of the default configuration dialog should be used.
 * @param {Object} ajaxProxy - AJAX proxy of the endpoint in Jenkins Java model object
 */
EChartsJenkinsApi.prototype.renderTrendChart = function (chartDivId, enableLinks, configurationId, ajaxProxy) {
    function hasConfigurationDialog() {
        return configurationId != null && configurationId.length > 0;
    }

    /**
     * Renders a trend chart in the specified div using ECharts.
     *
     * @param {HTMLElement} chartPlaceHolder - the div where the chart should be shown in
     * @param {Object} chart - the ECharts instance
     * @param {String} model - the line chart model
     * @param {Boolean} enableOnClickHandler - to enable clicking on the chart to see the results
     */
     function render(chartPlaceHolder, chart, model, enableOnClickHandler) { // eslint-disable-line no-unused-vars
        const chartModel = JSON.parse(model);
        let selectedBuild; // the tooltip formatter will change this value while hoovering

        if (enableOnClickHandler) {
            const urlName = chartPlaceHolder.getAttribute("tool");
            if (urlName) {
                chartPlaceHolder.onclick = function () {
                    if (urlName && selectedBuild > 0) {
                        window.location.assign(selectedBuild + '/' + urlName);
                    }
                };
            }
        }

        const textColor = getComputedStyle(document.body).getPropertyValue('--text-color') || '#333';

        const options = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross',
                    label: {
                        backgroundColor: '#6a7985'
                    }
                },
                formatter: function (params, ticket, callback) {
                    if (params.componentType === 'legend') {
                        selectedBuild = 0;
                        return params.name;
                    }

                    const builds = chartModel.buildNumbers;
                    const labels = chartModel.domainAxisLabels;
                    for (let i = 0; i < builds.length; i++) {
                        if (params[0].name === labels[i]) {
                            selectedBuild = builds[i];
                            break;
                        }
                    }

                    let text = 'Build ' + params[0].name.escapeHTML();
                    for (let i = 0, l = params.length; i < l; i++) {
                        text += '<br/>' + params[i].marker + params[i].seriesName + ' : ' + params[i].value;
                    }
                    text += '<br />';
                    return '<div style="text-align:left">' + text + '</div>';
                }
            },
            toolbox: {
                itemSize: 16,
                show: hasConfigurationDialog(),
                feature: {
                    myTool1: {
                        title: 'Setup',
                        icon: 'ipath://M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z',
                        onclick: function () {
                            selectedBuild = 0;
                            new bootstrap5.Modal(document.getElementById(configurationId)).show();
                        }
                    }
                }
            },
            legend: {
                orient: 'horizontal',
                type: 'scroll',
                x: 'center',
                y: 'top',
                textStyle: {
                    color: textColor
                }
            },
            grid: {
                left: '20',
                right: '10',
                bottom: '10',
                top: '30',
                containLabel: true
            },
            xAxis: [{
                type: 'category',
                boundaryGap: false,
                data: chartModel.domainAxisLabels,
                axisLabel: {
                    color: textColor
                }
            }
            ],
            yAxis: [{
                type: 'value',
                axisLabel: {
                    color: textColor
                }
            }
            ],
            series: chartModel.series
        };
        chart.hideLoading();
        chart.setOption(options);
        chart.on('legendselectchanged', function (params) {
            selectedBuild = 0; // clear selection to avoid navigating to the selected build
        });
        chart.resize();
        window.onresize = function () {
            chart.resize();
        };
    }

    const chartPlaceHolder = document.getElementById(chartDivId);
    const chart = echarts.init(chartPlaceHolder);
    chart.showLoading();
    chartPlaceHolder.echart = chart;

    if (hasConfigurationDialog()) { // AsyncConfigurableTrendChart
        const configuration = localStorage.getItem('echarts#trend#' + configurationId);
        ajaxProxy.getConfigurableBuildTrendModel(configuration, function (trendModel) {
            render(chartPlaceHolder, chart, trendModel.responseJSON, !!(enableLinks && enableLinks !== "false"));
        });
    }
    else { // AsyncTrendChart
        ajaxProxy.getBuildTrendModel(function (trendModel) {
            render(chartPlaceHolder, chart, trendModel.responseJSON, !!(enableLinks && enableLinks !== "false"));
        });
    }
}
