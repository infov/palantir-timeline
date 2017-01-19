!function(d3){
    'use strict';
    d3.customCharts = d3.customCharts || {};
    d3.customCharts.timeline = function module() {
        var margin = {top: 20, right: 20, bottom: 40, left: 40};
        var width = 600-margin.left-margin.right;
        var height = 500-margin.top-margin.bottom;
        var dataSet;
        var svgContainer;
        var svg;
        var minDate;
        var maxDate;
        var currentTimeBin;
        var currentBarWidth;
        var currentTimeFormat;
        var currentYaxisMaxValue;
        var currentZoomScale=1;
        var Mon3="1q";
        var Mon1="1M";
        var D15="15d";
        var D10="10d";
        var D4="4d";
        var D1="1d";
        var H12="12h";
        var H6="6h";
        var H1="1h";
        var M30="30m";
        var M10="10m";
        var M5="5m";
        var M1="1m";
        var S30="30s";
        var S10="10s";
        var S5="5s";
        var S2="2s";
        var S1="1s";
        var zoomType;
        var OPERATION_ZOOMIN=0;
        var OPERATION_ZOOMOUT=1;
        var OPERATION_PAN=2;// pan or up to limit
        var gGrid;
        var gYAxis;
        var groups;
        var gLoading_circle;
        var xScale;
        var hackBarWidth;
        var timebin_zoomstart;
        var xAxis;
        var dispatch = d3.dispatch('customDataFetch','customBrushSelection');
        var stack = d3.stack();
        function exports(_selection) {
            _selection.each(function(_data) {
                //data in the forms of [{date:xxx,count:1},...]
                handleData(_data);
                var color = d3.scaleOrdinal()
                    .range(["#1f77b4", "#2ca02c", "#E53524"]);
                // selectedColor #dbb510
                var color_hash = {
                    0 : ["objectType", "purple"],
                    1 : ["Insert", "#2ca02c"],
                    2 : ["Remove", "#E53524"]
                };
                hackBarWidth={
                    feb_28:{
                        day_15:{
                            start_16:0
                        },
                        day_10:{
                            start_21:0
                        }
                    },
                    feb_29:{
                        day_15:{
                            start_16:0
                        },
                        day_10:{
                            start_21:0
                        },
                        day_4:{
                            start_25:0
                        }
                    },
                    month_30:{
                        day_4:{
                            start_25:0
                        }
                    },
                    month_31:{
                        day_15:{
                            start_16:0
                        },
                        day_10:{
                            start_21:0
                        },
                        day_4:{
                            start_25:0
                        }
                    }
                };
                var debounceFn_zoomAnimation=null;
                // d3.locale for EN
                d3.formatDefaultLocale({
                    "decimal": ".",
                    "thousands": ",",
                    "grouping": [3],
                    "currency": ["$", ""],
                    "dateTime": "%a %b %e %X %Y",
                    "date": "%m/%d/%Y",
                    "time": "%H:%M:%S",
                    "periods": ["am", "pm"],
                    "days": ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    "shortDays": ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    "months": ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    "shortMonths": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                });
                var xAxis_yearFormat = d3.timeFormat("%Y");
                var xAxis_monthFormat= d3.timeFormat("%b");
                var xAxis_monthDayFormat=d3.timeFormat("%b %e");
                var xAxis_hourFormat=d3.timeFormat("%I%p");
                var xAxis_minuteFormat=d3.timeFormat("%M");
                var xAxis_secondFormat=d3.timeFormat("%S");

                var customTimeFormat=function(date){
                    if(date.getSeconds()) return d3.timeFormat(':%S')(date);
                    if(date.getMinutes()) return d3.timeFormat('%I:%M')(date);
                    if(date.getHours()) return d3.timeFormat('%I %p')(date);
                    if(date.getDay() && date.getDate() != 1) return d3.timeFormat('%a %d')(date);
                    if(date.getDate()!=1) return d3.timeFormat('%b %d')(date);
                    if(date.getMonth()) return d3.timeFormat('%B')(date);
                    return d3.timeFormat('%Y')(date);
                };

                //Set up scales
                xScale = d3.scaleTime()
                    .domain([minDate, maxDate])
                    .rangeRound([0, width]).nice();

                var tickFormatFn={
                    month:function(d){
                        if(d.getMonth()===0){
                            return xAxis_yearFormat(d);
                        }else{
                            if(currentZoomScale>d3_time_tickFormatScaleSteps[0]) return xAxis_monthFormat(d);
                            return "";
                        }
                    },
                    day:function(d){
                        if(d.getMonth()===0&&d.getDate()===1){
                            return xAxis_yearFormat(d);
                        }else{
                            if(d.getDate()===1){
                                return xAxis_monthFormat(d);
                            }else{
                                if(currentZoomScale>d3_time_tickFormatScaleSteps[1]) return xAxis_monthDayFormat(d);
                                return "";
                            }
                        }
                    },
                    hour:function(d){
                        if(d.getMonth()===0&&d.getDate()===1&&d.getHours()===0){
                            return xAxis_yearFormat(d);
                        }else{
                            if(d.getHours()===0) {
                                if(d.getDate()===1){
                                    return xAxis_monthFormat(d);
                                }else{
                                    return xAxis_monthDayFormat(d);
                                }
                            }else{
                                if(currentZoomScale>d3_time_tickFormatScaleSteps[2]) return _stripLeadingZero(xAxis_hourFormat(d));
                                return "";
                            }
                        }
                    },
                    minute:function(d){
                        if(d.getMonth()===0&&d.getDate()===1&&d.getHours()===0&&d.getMinutes()===0){
                            return xAxis_yearFormat(d);
                        }else{
                            if(d.getMinutes()===0) {
                                if(d.getHours()===0){
                                    if(d.getDate()===1){
                                        return xAxis_monthFormat(d);
                                    }else{
                                        return xAxis_monthDayFormat(d);
                                    }
                                }
                                return _stripLeadingZero(xAxis_hourFormat(d));
                            }else{
                                if(currentZoomScale>d3_time_tickFormatScaleSteps[3]) return _stripLeadingZero(xAxis_minuteFormat(d));
                                return "";
                            }
                        }
                    },
                    second:function(d){
                        if(d.getMonth()===0&&d.getDate()===1&&d.getHours()===0&&d.getMinutes()===0&&d.getSeconds()===0){
                            return xAxis_yearFormat(d);
                        }else{
                            if(d.getSeconds()===0) {
                                if(d.getMinutes()===0){
                                    if(d.getHours()===0){
                                        if(d.getDate()===1){
                                            return xAxis_monthFormat(d);
                                        }else{
                                            return xAxis_monthDayFormat(d);
                                        }
                                    }
                                    return _stripLeadingZero(xAxis_hourFormat(d));
                                }
                                return _stripLeadingZero(xAxis_minuteFormat(d));
                            }else{
                                if(currentZoomScale>d3_time_tickFormatScaleSteps[4]) return _stripLeadingZero(xAxis_secondFormat(d));
                                return "";
                            }
                        }
                    }
                };

                function _stripLeadingZero(time){
                    if(typeof time ==='string') return time.replace(/^0/,'');
                }

                // set the dateformat for hoverline axisExtent ...
                var commonDateFormat={
                    month:[d3.timeFormat('%b. %Y'),60,100],
                    day:[d3.timeFormat('%a %d, %b. %Y'),100,140],
                    hour:[d3.timeFormat('%a %d, %b. %Y, %I%p'),140,180],
                    minute:[d3.timeFormat('%a %d, %b. %Y, %I:%M %p'),152,192],
                    second:[d3.timeFormat('%a %d, %b. %Y, %I:%M:%S %p'),168,208]
                };
                // 1s 2s 5s 10s 30s 1m 5m 10m 30m 1h 6h 12h 1d 4d 10d 15d 1month 3month
                var d3_time_zoomScaleSteps=[2,6,10,22,70,180,450,1000,4000,9600,18000,30000,230000,480000,1340000,3200000,4000000,4000000];
                // month day hour minute second
                var d3_time_tickFormatScaleSteps=[8,200,5800,220000,9000000];
                var d3_time_bin=d3.map({
                    '1q':_generateXaxis([d3.timeMonth,3,'3 months',d3.timeYear,null,commonDateFormat.month,2]),//<2
                    '1M':_generateXaxis([d3.timeMonth,1,'1 month',d3.timeMonth,tickFormatFn.month,commonDateFormat.month,6]),//<6
                    '15d':_generateXaxis([d3.timeDay,15,'15 days',d3.timeMonth,tickFormatFn.month,commonDateFormat.day,10]),//<10
                    '10d':_generateXaxis([d3.timeDay,10,'10 days',d3.timeMonth,tickFormatFn.month,commonDateFormat.day,22]),//<22
                    '4d':_generateXaxis([d3.timeDay,4,'4 days',d3.timeMonth,tickFormatFn.month,commonDateFormat.day,70]),//<70
                    '1d':_generateXaxis([d3.timeDay,1,'1 day',d3.timeDay,tickFormatFn.day,commonDateFormat.day,180]),//<180
                    '12h':_generateXaxis([d3.timeHour,12,'12 hours',d3.timeDay,tickFormatFn.day,commonDateFormat.hour,450]),//<450
                    '6h':_generateXaxis([d3.timeHour,6,'6 hours',d3.timeDay,tickFormatFn.day,commonDateFormat.hour,1000]),//<1000
                    '1h':_generateXaxis([d3.timeHour,1,'1 hour',d3.timeHour,tickFormatFn.hour,commonDateFormat.hour,4000]),//<4000
                    '30m':_generateXaxis([d3.timeMinute,30,'30 minutes',d3.timeHour,tickFormatFn.hour,commonDateFormat.minute,9600]),//<9600
                    '10m':_generateXaxis([d3.timeMinute,10,'10 minutes',d3.timeHour,tickFormatFn.hour,commonDateFormat.minute,18000]),//<18000
                    '5m':_generateXaxis([d3.timeMinute,5,'5 minutes',d3.timeHour,tickFormatFn.hour,commonDateFormat.minute,30000]),//<30000
                    '1m':_generateXaxis([d3.timeMinute,1,'1 minute',d3.timeMinute,tickFormatFn.minute,commonDateFormat.minute,230000]),//<230000
                    '30s':_generateXaxis([d3.timeSecond,30,'30 seconds',d3.timeMinute,tickFormatFn.minute,commonDateFormat.second,480000]),//<480000
                    '10s':_generateXaxis([d3.timeSecond,10,'10 seconds',d3.timeMinute,tickFormatFn.minute,commonDateFormat.second,1340000]),//<1340000
                    '5s':_generateXaxis([d3.timeSecond,5,'5 seconds',d3.timeMinute,tickFormatFn.minute,commonDateFormat.second,3200000]),//<3200000
                    '2s':_generateXaxis([d3.timeSecond,2,'2 seconds',d3.timeMinute,tickFormatFn.minute,commonDateFormat.second,4000000]),//<4000000
                    '1s':_generateXaxis([d3.timeSecond,1,'1 second',d3.timeSecond,tickFormatFn.second,commonDateFormat.second,4000000]) //>4000000
                });
                currentTimeFormat=d3_time_bin.get(currentTimeBin)[5][0];

                function _generateXaxis(binArray){
                    binArray.xAxis=d3.axisBottom(xScale)
                        .ticks(binArray[3],1)
                        .tickSizeOuter(0)
                        .tickPadding(5)
                        .tickFormat(binArray[4]||customTimeFormat);
                    return binArray;
                }

                var yScale = d3.scaleLinear()
                    .domain([0,currentYaxisMaxValue])
                    .range([height, 0]);
                xAxis = d3.axisBottom(xScale)
                    .ticks(d3.timeYear,1)
                    .tickSizeOuter(0)
                    .tickPadding(5)
                    .tickFormat(customTimeFormat);

                _calculateCurrentBarWidth(d3_time_bin.get(currentTimeBin));

                var yAxis = d3.axisLeft(yScale)
                    .ticks(6)
                    .tickSize(0)
                    .tickFormat(function (d) {
                        if(d&&isInt(d)) return d;
                    });

                var brush = d3.brushX()
                    .extent([[0,0],[width,height]])
                    .on('start',brushstart)
                    .on('brush',brushed)
                    .on('end',brushend);

                var zoom = d3.zoom()
                    .scaleExtent([1,20000000])
                    .on('start',zoomstart)
                    .on("zoom", zoomed)
                    .on('end',debounce(zoomend,50))
                    .filter(function(){return true;});
                //Create SVG element
                if(!svgContainer){
                    svgContainer=d3.select(this).append("svg")
                        .attr("width", width+margin.left+margin.right)
                        .attr("height", height+margin.top+margin.bottom);
                }
                if(svg) svg.remove();
                svg =svgContainer.append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(zoom)
                    .on('dblclick.zoom',null);// disable double click zoom
                var defs=svg.append('defs');
                defs.append('clipPath')
                    .attr("id", "clip")
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", width)
                    .attr("height", height);

                var gradient = defs.append("linearGradient")
                    .attr("id", "timeline-gradient")
                    .attr("x1", "0%")
                    .attr("y1", "100%")
                    .attr("x2", "0%")
                    .attr("y2", "0%")
                    .attr("spreadMethod", "pad");

                gradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#BFBFBF")
                    .attr("stop-opacity", 0.1);

                gradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#686A6B")
                    .attr("stop-opacity", 1);

                var tipsGradient = defs.append("linearGradient")
                    .attr("id", "tipsGradient")
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "0%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");
                tipsGradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#A6A6A6")
                    .attr("stop-opacity", 1);
                tipsGradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#545454")
                    .attr("stop-opacity", 1);

                var sliderGradient = defs.append("linearGradient")
                    .attr("id", "sliderGradient")
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "0%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");
                sliderGradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#bababa")
                    .attr("stop-opacity", 1);
                sliderGradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#5b5b5b")
                    .attr("stop-opacity", 1);

                var sliderExtentGradient=defs.append("linearGradient")
                    .attr("id", "sliderExtentGradient")
                    .attr("x1", "0%")
                    .attr("y1", "0%")
                    .attr("x2", "0%")
                    .attr("y2", "100%")
                    .attr("spreadMethod", "pad");
                sliderExtentGradient.append("stop")
                    .attr("offset", "0%")
                    .attr("stop-color", "#fff")
                    .attr("stop-opacity", 1);
                sliderExtentGradient.append("stop")
                    .attr("offset", "100%")
                    .attr("stop-color", "#bebebe")
                    .attr("stop-opacity", 1);

                // loading gif
                var pattern_loading= defs.append('pattern');
                pattern_loading
                    .attr('id','timeline-loading')
                    .attr('x',0)
                    .attr('y',0)
                    .attr('height',40)
                    .attr('width',40);
                pattern_loading.append('image')
                    .attr('x',0)
                    .attr('y',0)
                    .attr('width',40)
                    .attr('height',40)
                    .attr('xlink:href','misc/timeline-loading.gif');

                gGrid=svg.append("g")
                    .attr("class", "grid")
                    .call(make_y_axis()
                        .tickSize(-width,0)
                        .tickFormat("")
                    ); // elements are drawn in the order they are specified in the document, so later elements will be drawn on top of earlier elements.

                // Add a group for each row of data
                groups = svg.append('g')
                    .attr('clip-path', 'url(#clip)')
                    .selectAll("g.rgroups")
                    .data(dataSet)
                    .enter()
                    .append("g")
                    .attr("class", "rgroups")
                    .attr("transform", "translate(0," + height + ")")
                    .style("fill", function (d) {
                        return color_hash[dataSet.indexOf(d)][1];
                    });

                // Add a rect for each data value
                var rects = groups.selectAll("rect")
                    .data(function (d) {
                        return d;
                    })
                    .enter()
                    .append("rect")
                    .attr("width", 1)
                    .style("fill-opacity", 1e-6);

                rects.transition()
                    .duration(function (d, i) {
                        return 10 * i;// from 100->10
                    })
                    .ease(d3.easeLinear)
                    .attr("x", function (d) {
                        return xAxis.scale()(d.Date);
                    })
                    .attr("y", function (d) {
                        return  - (-yScale(d.y0)- yScale(d.y) + height * 2);
                    })
                    .attr("height", function (d) {
                        return -yScale(d.y) + height;
                    })
                    .attr("width", currentBarWidth)
                    .style("fill-opacity", 1);

                // draw axis-background
                svg.append('g')
                    .attr('class','axis-background')
                    .style('pointer-events','none')
                    .attr("transform", "translate(0," + height  + ")")
                    .append('rect')
                    .attr('x',-25)
                    .attr('y',0)
                    .attr('width',width+25+5)
                    .attr('height',31)
                    .attr('stroke','none')
                    .style('fill-opacity',0.6)
                    .style('fill','url(#sliderGradient)');

                var gXAxis= svg.append("g")
                    .attr("class", "x axis")
                    .style('pointer-events','none')
                    .attr("transform", "translate(0," + height  + ")")
                    .call(xAxis);

                gYAxis=svg.append("g")
                    .attr("class", "y axis")
                    .style('pointer-events','none')
                    .call(yAxis);
                var gXBrush= svg.append("g").attr("class", "x brush");
                gXBrush.on('mousedown',function(){
                    if(d3.event.button===0){
                        d3.event.stopPropagation();
                    }else if(d3.event.button===2){
                        d3.event.stopImmediatePropagation();
                        svg.on('mousedown.zoom').call(svg.node());
                        d3.select('.brush .overlay').style('cursor','move');
                        _clearBrush(2);
                    }
                })
                    .on('mouseup',function(){
                        if(d3.event.button===2){
                            d3.select('.brush .overlay').style('cursor','default');
                        }
                    })
                    .on('mousemove',function(){
                        _refreshHoverLinePosition(d3.event.button,d3.mouse(this)[0]);
                    })
                    .on('mouseout',function(){
                        gHoverLine.style('visibility','hidden');
                    })
                    .call(brush)
                    .selectAll("rect")
                    .attr("y", -6)
                    .attr("height", height+7);

                function _refreshHoverLinePosition(buttonFlag,xPosition){
                    var time_bin=d3_time_bin.get(currentTimeBin);
                    var rectWidth=time_bin[5][1];
                    if(buttonFlag===2){
                        gHoverLine.style('visibility','hidden');
                        return;
                    }
                    hoverLine.attr("x1", xPosition).attr("x2", xPosition);
                    hoverLineRect
                        .attr('x',xPosition-rectWidth/2)
                        .attr('width',rectWidth);
                    hoverLineText.attr('x',xPosition+6-rectWidth/2)
                        .text(currentTimeFormat(xAxis.scale().invert(xPosition)));
                    gHoverLine.style('visibility','visible');
                }

                var gXBrush_Extent=d3.select('.brush .selection');
                var gXBrush_Background=d3.select('.brush .overlay');
                gXBrush_Extent.on('mouseover',function(){
                    if(d3.brushSelection(gXBrush.node())){
                        gTips.style('visibility','visible');
                        gXBrush_Extent.style('stroke','#686A6B');
                        gXBrush_Extent.style('cursor','move');
                    }else{
                        gXBrush_Extent.style('cursor','default');
                    }
                })
                    .on('mouseout',function(){
                        gTips.style('visibility','hidden');
                        gXBrush_Extent.style('stroke','none');
                    })
                    .on('mousemove',function(){
                        if(d3.brushSelection(gXBrush.node())) d3.event.stopPropagation();
                    })
                    .on('mousedown',function(){
                        if(!d3.brushSelection(gXBrush.node())) gHoverLine.style('visibility','visible');
                    });

                gXBrush_Background.style('cursor','default')
                    .on('mousedown',function(){
                        gXBrush_Extent.style('stroke','#686A6B');
                    })
                    .on('mousemove',function(){
                        gXBrush_Extent.style('stroke','none');
                        gTips.style('visibility','hidden');
                    });

                var gClose=svg.append('g')
                    .attr('class','closeBrush')
                    .style('visibility','hidden');

                gClose.append('rect')
                    .attr('x',0)
                    .attr('y',3)
                    .attr('rx',2)
                    .attr('ry',2)
                    .attr('width',14)
                    .attr('height',14)
                    .attr('stroke','gray')
                    .attr('fill','white');

                gClose.append('text')
                    .attr('font-family','FontAwesome')
                    .text('\uf00d')
                    .attr('x',1.5)
                    .attr('y',14)
                    .attr('dx',1)
                    .attr('fill','gray')
                    .style('cursor','pointer')
                    .on('mousedown',function(){
                        _clearBrush(0);
                        d3.event.stopPropagation();
                    });

                var gTips=svg.append('g')
                    .attr('class','tips')
                    .style('pointer-events','none')
                    .style('visibility','hidden');

                gTips.append('rect')
                    .attr('x',0)
                    .attr('y',20)
                    .attr('width',d3_time_bin.get(currentTimeBin)[5][2])
                    .attr('height',50)
                    .attr('rx',6)
                    .attr('ry',6)
                    .attr('stroke','black')
                    .style('fill','url(#tipsGradient)');

                gTips.append('text')
                    .attr('class','startText')
                    .style('fill','white')
                    .style('font-size','13px')
                    .attr('x',20)
                    .attr('y',38);

                gTips.append('text')
                    .attr('class','endText')
                    .style('font-size','13px')
                    .style('fill','white')
                    .attr('x',20)
                    .attr('y',60);

                var gHoverLine=svg.append('g')
                    .attr('class','hover-line')
                    .style('visibility','hidden')
                    .style('pointer-events','none');

                var hoverLine=gHoverLine.append('line')
                    .attr('x1',0)
                    .attr('x2',0)
                    .attr('y1',0)
                    .attr('y2',height)
                    .style('fill','none')
                    .style('stroke','#C7C7C7')
                    .style('stroke-width','2px')
                    .style('stroke-opacity',0.5);
                var hoverLineRect=gHoverLine.append('rect')
                    .attr('x',0)
                    .attr('y',5)
                    .attr('rx',2)
                    .attr('ry',2)
                    .attr('width',d3_time_bin.get(currentTimeBin)[5][1])
                    .attr('height',18)
                    .style('stroke','gray')
                    .style('stroke-width','2px')
                    .style('fill','#DFDEE0');

                var hoverLineText=gHoverLine.append('text')
                    .attr('x',6)
                    .attr('y',12+5)
                    .style('font-size','10px')
                    .style('fill','#5c5a56');

                var gAxisExtent=svg.append('g')
                    .attr('class','axis-extent')
                    .style('pointer-events','none');

                var axisExtentText=gAxisExtent.append('text')
                    .attr('x',-30)
                    .attr('y',-10)
                    .style('font-size','12px')
                    .style('fill','gray')
                    .text(function(){
                        return 'Showing '+currentTimeFormat(xAxis.scale().domain()[0])+' through '+currentTimeFormat(xAxis.scale().domain()[1]);
                    });
                var gBinSize=svg.append('g')
                    .attr('class','bin-size')
                    .style('pointer-events','none');

                var binSizeText=gBinSize.append('text')
                    .attr('x',width-112)
                    .attr('y',-10)
                    .style('font-size','12px')
                    .style('fill','gray')
                    .text(function(){
                        return 'Bin size: '+d3_time_bin.get(currentTimeBin)[2];
                    });

                var gZoomAnimationLeft=svg.append('g')
                    .attr('class','zoom-animation-left')
                    .style('pointer-events','none');
                var gZoomAnimationRight=svg.append('g')
                    .attr('class','zoom-animation-right')
                    .style('pointer-events','none');
                /*===============draw zoom slider================*/
                var sliderColor='#3c3c3c';
                var sliderMax_center_to_top=11;
                var sliderMin_center_to_bottom=15;
                var sliderCircle_radius=8;
                var sliderTarget_margin=3;
                var gZoomSlide=svg.append('g')
                    .attr('class','zoom-slide')
                    .style('pointer-events','none');

                var zoomSlide_Rect=gZoomSlide.append('rect');
                zoomSlide_Rect
                    .attr('x',width-30+0.5)
                    .attr('y',0+0.5)
                    .attr('rx',5)
                    .attr('ry',5)
                    .attr('width',22)
                    .attr('height',height-5)
                    .attr('stroke','black')
                    .style('stroke-width','1px')
                    .style('stroke-opacity',1)
                    .style('fill-opacity',0.7)
                    .style('fill','url(#sliderGradient)');

                var gZoomSlide_max=gZoomSlide.append('g')
                    .attr('class','zoom-slide-max')
                    .style('pointer-events','none');

                gZoomSlide_max.append('circle')
                    .attr('cx',width-19)
                    .attr('cy',sliderMax_center_to_top)
                    .attr('r',sliderCircle_radius)
                    .style('stroke',sliderColor)
                    .style('stroke-width',2)
                    .style('fill','url(#sliderExtentGradient)');
                gZoomSlide_max.append('line')
                    .attr('x1',width-19)
                    .attr('y1',sliderMax_center_to_top-5)
                    .attr('x2',width-19)
                    .attr('y2',sliderMax_center_to_top+5)
                    .style('stroke','gray')
                    .style('stroke-width','2px');
                gZoomSlide_max.append('line')
                    .attr('x1',width-19-5)
                    .attr('y1',sliderMax_center_to_top)
                    .attr('x2',width-19+5)
                    .attr('y2',sliderMax_center_to_top)
                    .style('stroke',sliderColor)
                    .style('stroke-width','2px');
                gZoomSlide_max.append('line')
                    .attr('x1',width-19+5)
                    .attr('y1',sliderMax_center_to_top+5)
                    .attr('x2',width-19+9)
                    .attr('y2',sliderMax_center_to_top+9)
                    .style('stroke',sliderColor)
                    .style('stroke-width','2px');

                var gZoomSlide_min=gZoomSlide.append('g')
                    .attr('class','zoom-slide-min')
                    .style('pointer-events','none');

                gZoomSlide_min.append('circle')
                    .attr('cx',width-19)
                    .attr('cy',height-sliderMin_center_to_bottom)
                    .attr('r',sliderCircle_radius)
                    .style('stroke',sliderColor)
                    .style('stroke-width',2)
                    .style('fill','url(#sliderExtentGradient)');
                gZoomSlide_min.append('line')
                    .attr('x1',width-19-3)
                    .attr('y1',height-sliderMin_center_to_bottom)
                    .attr('x2',width-19+3)
                    .attr('y2',height-sliderMin_center_to_bottom)
                    .style('stroke','gray')
                    .style('stroke-width','2px');
                gZoomSlide_min.append('line')
                    .attr('x1',width-19+5)
                    .attr('y1',height-sliderMin_center_to_bottom+5)
                    .attr('x2',width-19+9)
                    .attr('y2',height-sliderMin_center_to_bottom+9)
                    .style('stroke',sliderColor)
                    .style('stroke-width','2px');

                var zoomSlide_orbitLine=gZoomSlide.append('line');
                zoomSlide_orbitLine
                    .attr('x1',width-19)
                    .attr('x2',width-19)
                    .attr('y1',sliderMax_center_to_top+2*sliderCircle_radius)
                    .attr('y2',height-sliderMin_center_to_bottom-2*sliderCircle_radius)
                    .style('stroke','black')
                    .style('stroke-width','3px');

                var gZoomSlide_target=gZoomSlide.append('g')
                    .attr('class','zoom-slide-target')
                    .style('pointer-events','none');

                var currentSlider_yPostion=height-sliderMin_center_to_bottom-2*sliderCircle_radius-sliderTarget_margin;
                gZoomSlide_target.append('circle')
                    .attr('cx',width-19)
                    .attr('cy',currentSlider_yPostion)
                    .attr('r',sliderCircle_radius)
                    .style('stroke',sliderColor)
                    .style('stroke-width',2)
                    .style('fill','url(#sliderExtentGradient)');
                gZoomSlide_target.append('path')
                    .attr('class','slider-triangle-up')
                    .attr('d',function(){
                        var leftX=width-19-4;
                        var leftY=currentSlider_yPostion;
                        var topX=width-19;
                        var topY=currentSlider_yPostion-6;
                        var rightX=width-19+4;
                        var rightY=currentSlider_yPostion;
                        return 'M ' + leftX +' '+ leftY + ' L '+topX+' '+topY+' L '+rightX+' '+rightY +' z';
                    })
                    .style('stroke','gray')
                    .style('fill','#fad433')
                    .style('opacity',0.2);
                gZoomSlide_target.append('path')
                    .attr('class','slider-triangle-down')
                    .attr('d',function(){
                        var leftX=width-19-4;
                        var leftY=currentSlider_yPostion;
                        var bottomX=width-19;
                        var bottomY=currentSlider_yPostion+6;
                        var rightX=width-19+4;
                        var rightY=currentSlider_yPostion;
                        return 'M ' + leftX +' '+ leftY + ' L '+bottomX+' '+bottomY+' L '+rightX+' '+rightY +' z';
                    })
                    .style('stroke','gray')
                    .style('fill','#fad433')
                    .style('opacity',0.6);
                gZoomSlide_target.append('line')
                    .attr('x1',width-19+5)
                    .attr('y1',currentSlider_yPostion+5)
                    .attr('x2',width-19+9)
                    .attr('y2',currentSlider_yPostion+9)
                    .style('stroke',sliderColor)
                    .style('stroke-width','2px');

                var gTimeline_loading=svg.append('g')
                    .attr('class','timeline-loading')
                    .style("pointer-events", "none");
                gLoading_circle=gTimeline_loading.append('circle')
                    .attr("class", "loading-circle")
                    .attr("cx", width-45)
                    .attr("cy", 38)
                    .attr("r", 30)
                    .style("fill", "transparent")
                    .style("stroke", "none")
                    .style('visibility','hidden')
                    .style("fill", "url(#timeline-loading)");

                function debounce(callback,delay){
                    var timeoutID;
                    delay=delay||0;
                    return function(){
                        if(timeoutID) clearTimeout(timeoutID);
                        var args=arguments;
                        timeoutID=setTimeout(function(){
                            callback.apply(null,args);
                        },delay);
                    };
                }

                // selction area
                function brushed(){
                    var selection;
                    if(!(selection=d3.event.selection)) return;
                    var start=selection[0];
                    var end=selection[1];
                    var start_date=xAxis.scale().invert(start);
                    var end_date=xAxis.scale().invert(end);
                    gClose.style('visibility','visible');
                    gTips.style('visibility','visible');
                    gClose.select('rect')
                        .attr('x',end-20);
                    gClose.select('text')
                        .attr('x',end+1.5-20);

                    var gTipsWidth=d3_time_bin.get(currentTimeBin)[5][2];
                    gTips.select('rect')
                        .attr('x',start-gTipsWidth-10)
                        .attr('width',gTipsWidth);
                    gTips.select('.startText')
                        .attr('x',start+20-gTipsWidth-10)
                        .text(currentTimeFormat(start_date));
                    gTips.select('.endText')
                        .attr('x',start+20-gTipsWidth-10)
                        .text(currentTimeFormat(end_date));
                    gXBrush_Extent.style('stroke','#686A6B');
                    _highlightBarChart();
                }

                function brushstart(){
                    var selection=d3.brushSelection(gXBrush.node());
                    var mouse_position=d3.mouse(this)[0];
                    if(selection&&mouse_position==selection[0]) gClose.style('visibility','hidden'),gTips.style('visibility','hidden'),_removeHighlightForBarChart();
                }

                function brushend(){
                    if(d3.brushSelection(gXBrush.node())) _postCurrentBrushExtent();
                }

                // return hacked range for brush extent
                function _calculateHackBrushExtent(){
                    var node=gXBrush.node();
                    var startDate=xAxis.scale().invert(d3.brushSelection(node)[0]);
                    var endDate=xAxis.scale().invert(d3.brushSelection(node)[1]);
                    var rects=groups.selectAll("rect");
                    var brushArrayOnlyLeftIn=[];
                    var brushArrayOnlyRightIn=[];
                    var result={
                        fakeStartDate:null,
                        fakeEndDate:null
                    };
                    rects.each(function(d){
                        var maxDate=_calculateMaxDateForOneBar(d.Date);//msec
                        var is_brushed_left = +startDate <= +d.Date && +d.Date <= +endDate;
                        var is_brushed_right= +startDate <= maxDate && maxDate <= +endDate;
                        if(is_brushed_left){
                            if(!is_brushed_right) brushArrayOnlyLeftIn.push(+d.Date)
                        }else{
                            if(is_brushed_right) brushArrayOnlyRightIn.push(maxDate);
                        }
                    });

                    if(brushArrayOnlyLeftIn.length){
                        result.fakeEndDate=brushArrayOnlyLeftIn[0];
                        if(brushArrayOnlyRightIn.length) result.fakeStartDate=brushArrayOnlyRightIn[0];
                    }else{
                        if(brushArrayOnlyRightIn.length) result.fakeStartDate=brushArrayOnlyRightIn[0];
                    }

                    return result;
                }

                function _highlightBarChart(){
                    var rects=groups.selectAll("rect");
                    var selection=d3.event.selection;
                    var start=selection[0];
                    var end=selection[1];
                    var start_date=xAxis.scale().invert(start);
                    var end_date=xAxis.scale().invert(end);
                    rects.classed('selected',function(d){
                        var is_brushed_left = +start_date <= +d.Date && +d.Date <= +end_date;
                        var maxDate=_calculateMaxDateForOneBar(d.Date);//msec
                        var is_brushed_right= +start_date <= maxDate && maxDate <= +end_date;
                        if(!is_brushed_left) return;
                        if(is_brushed_right) return true;
                    });
                }

                function _calculateMaxDateForOneBar(minDate){
                    var maxDate;
                    var timebin=d3_time_bin.get(currentTimeBin);
                    var timeIntervalFn=timebin[0];
                    var timeStep=timebin[1];

                    switch (currentTimeBin){
                        case Mon3:
                        case Mon1:
                        case D1:
                        case H12:
                        case H6:
                        case H1:
                        case M30:
                        case M10:
                        case M5:
                        case M1:
                        case S30:
                        case S10:
                        case S5:
                        case S2:
                        case S1:
                            maxDate=timeIntervalFn.offset(minDate,timeStep);
                            break;
                        case D15:
                        case D10:
                        case D4:
                            maxDate=_hackDateHandler(minDate);
                            if(!maxDate) maxDate=timeIntervalFn.offset(minDate,timeStep);
                            break;
                    }
                    return +maxDate;

                    function _hackDateHandler(date) {
                        var months_Day31=[0,2,4,6,7,9,11];
                        var months_Day30=[3,5,8,10];
                        var year=date.getFullYear();
                        var month=date.getMonth();
                        var day=date.getDate();
                        var leapFlag=_checkIfLeapYear(year);
                        if(month===1){
                            if(day===16&&currentTimeBin==D15){
                                return new Date(year,2);
                            }
                            if(day===21&&currentTimeBin==D10){
                                return new Date(year,2);
                            }
                            if(day===25&&currentTimeBin==D4&&leapFlag) return new Date(year,2);
                        }

                        if(months_Day30.indexOf(month)!==-1){
                            if(day===25&&currentTimeBin===D4) return new Date(year,month+1);
                        }

                        if(months_Day31.indexOf(month)!==-1){
                            if(day===16&&currentTimeBin===D15) return new Date(year,month+1);
                            if(day===21&&currentTimeBin===D10) return new Date(year,month+1);
                            if(day===25&&currentTimeBin===D4) return new Date(year,month+1);
                        }
                        return false;
                        function _checkIfLeapYear(year){
                            return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
                        }
                    }

                }
                // flag 0:from close button  1:from zoom fn   2:from right button
                function _clearBrush(flag){
                    if(!flag){
                        gXBrush.call(brush.move,null);
                        gXBrush.call(brush);
                        gClose.style('visibility','hidden');
                        gTips.style('visibility','hidden');
                        _postCurrentBrushExtent();
                    }else{
                        if(d3.brushSelection(gXBrush.node())){
                            gXBrush.call(brush.move,null);
                            gXBrush.call(brush);
                            gClose.style('visibility','hidden');
                            gTips.style('visibility','hidden');
                            _postCurrentBrushExtent();
                        }
                    }
                    _removeHighlightForBarChart();
                }

                function _removeHighlightForBarChart(){
                    var rects=groups.selectAll(".selected");
                    rects.classed('selected',false);
                }

                function _postCurrentBrushExtent(){
                    var brushExtent,startDate,endDate;
                    var node=gXBrush.node();
                    var selection=d3.brushSelection(node);
                    if(!selection){
                        brushExtent=null;
                    }else{
                        startDate=xAxis.scale().invert(selection[0]);
                        endDate=xAxis.scale().invert(selection[1]);
                        var fakeExtent=_calculateHackBrushExtent();
                        if(!fakeExtent.fakeStartDate) fakeExtent.fakeStartDate=+startDate;
                        if(!fakeExtent.fakeEndDate) fakeExtent.fakeEndDate=+endDate;
                        brushExtent={
                            startDate:fakeExtent.fakeStartDate,
                            endDate:fakeExtent.fakeEndDate,
                            realStartDate:+startDate,
                            realEndDate:+endDate
                        };
                    }
                    dispatch.call('customBrushSelection',null,brushExtent)
                }

                // function for the y grid lines
                function make_y_axis() {
                    return　d3.axisLeft(yScale)
                        .ticks(5);
                }

                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0 - 5)
                    .attr("x", 0 - (height / 2))
                    .attr("dy", "1em");

                svg.append("text")
                    .attr("class", "xtext")
                    .attr("x", width / 2)
                    .attr("y", height - 5)
                    .attr("text-anchor", "middle");

                svg.append("text")
                    .attr("class", "title")
                    .attr("x", width / 2)
                    .attr("y", 20)
                    .attr("text-anchor", "middle")
                    .style("font-size", "16px")
                    .style("text-decoration", "underline");

                function zoomstart(){timebin_zoomstart=currentTimeBin;}

                function zoomed() {
                    _clearBrush(1);
                    _showZoomAnimation(d3.event.transform.k,d3.mouse(this)[0],d3.mouse(this)[1]);
                    _refreshXaxisByZoomScale(d3.event.transform.k,d3.event.button,d3.mouse(this)[0]);
                    refreshYaxis(refreshBarChart(dataSet));
                }

                function zoomend(){
                    var request={timeInterval:currentTimeBin};
                    if(timebin_zoomstart!==currentTimeBin){
                        showTimelineLoading();
                        dispatch.call('customDataFetch',null,request);
                    }
                }

                function _showZoomAnimation(scale,mouseX,mouseY){
                    if(scale>currentZoomScale){
                        zoomType=OPERATION_ZOOMIN;
                        if(!debounceFn_zoomAnimation) debounceFn_zoomAnimation=debounce(generateZoomAnimation);
                        debounceFn_zoomAnimation(mouseX,mouseY);
                    }else if(scale<currentZoomScale){
                        zoomType=OPERATION_ZOOMOUT;
                    }else{
                        zoomType=OPERATION_PAN;
                    }
                    currentZoomScale=scale;
                    function generateZoomAnimation(m_x,m_y){
                        var d3_mouse_x=m_x;
                        var d3_mouse_y=m_y;
                        if(!gZoomAnimationLeft.selectAll('path').empty()) gZoomAnimationLeft.selectAll('path').remove();
                        if(!gZoomAnimationRight.selectAll('path').empty()) gZoomAnimationRight.selectAll('path').remove();
                        gZoomAnimationLeft.append('path')
                            .attr('d', function() {
                                var x = d3_mouse_x-45, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l -7 -7 z';
                            })
                            .style('fill','#fff')
                            .style('stroke','black')
                            .style('opacity',1)
                            .transition().duration(200)
                            .attr('d', function() {
                                var x = d3_mouse_x-55, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l -7 -7 z';
                            })
                            .transition().duration(450)
                            .attr('d', function() {
                                var x = d3_mouse_x-65, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l -7 -7 z';
                            })
                            .style('opacity',0).remove();

                        gZoomAnimationRight.append('path')
                            .attr('d', function() {
                                var x = d3_mouse_x+45, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l 7 -7 z';
                            })
                            .style('fill','#fff')
                            .style('stroke','black')
                            .style('opacity',1)
                            .transition().duration(200)
                            .attr('d', function() {
                                var x = d3_mouse_x+55, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l 7 -7 z';
                            })
                            .transition().duration(450)
                            .attr('d', function() {
                                var x = d3_mouse_x+65, y = d3_mouse_y-7;
                                return 'M ' + x +' '+ y + ' l 0 14 l 7 -7 z';
                            })
                            .style('opacity',0).remove();
                    }
                }

                function _calculateCurrentBarWidth(axisBinSize){
                    var xScale_copy=xAxis.scale().copy();
                    var xScale_ticks=xScale_copy.ticks(axisBinSize[0],axisBinSize[1]);
                    if(xScale_ticks.length>2){
                        var val1=xScale_copy(xScale_ticks[1])-xScale_copy(xScale_ticks[0]);
                        var val2=xScale_copy(xScale_ticks[2])-xScale_copy(xScale_ticks[1]);
                        currentBarWidth=d3.max([val1,val2]);
                    }else{
                        console.warn('less than 3 ticks in the currentTickView');
                        currentBarWidth=15;
                    }
                    _fillHackBarWidth();// handler special width
                    function _fillHackBarWidth(){
                        switch (currentTimeBin){
                            case D15:
                                hackBarWidth.feb_28.day_15.start_16=xScale_copy(new Date(2001,2,1))-xScale_copy(new Date(2001,1,16));
                                hackBarWidth.feb_29.day_15.start_16=xScale_copy(new Date(2000,2,1))-xScale_copy(new Date(2000,1,16));
                                hackBarWidth.month_31.day_15.start_16=xScale_copy(new Date(2001,1,1))-xScale_copy(new Date(2001,0,16));
                                break;
                            case D10:
                                hackBarWidth.feb_28.day_10.start_21=xScale_copy(new Date(2001,2,1))-xScale_copy(new Date(2001,1,21));
                                hackBarWidth.feb_29.day_10.start_21=xScale_copy(new Date(2000,2,1))-xScale_copy(new Date(2000,1,21));
                                hackBarWidth.month_31.day_10.start_21=xScale_copy(new Date(2001,1,1))-xScale_copy(new Date(2001,0,21));
                                break;
                            case D4:
                                hackBarWidth.feb_29.day_4.start_25=xScale_copy(new Date(2000,2,1))-xScale_copy(new Date(2000,1,25));
                                hackBarWidth.month_30.day_4.start_25=xScale_copy(new Date(2001,4,1))-xScale_copy(new Date(2001,3,25));
                                hackBarWidth.month_31.day_4.start_25=xScale_copy(new Date(2001,1,1))-xScale_copy(new Date(2001,0,25));
                                break;
                        }
                    }
                }

                function _refreshXaxisByZoomScale(zoomScale,buttonFlag,mouseX){
                    var x_axis,
                        timeBin;
                    if(zoomScale<d3_time_zoomScaleSteps[0]){
                        currentTimeBin=Mon3;
                    }else if(zoomScale<d3_time_zoomScaleSteps[1]){
                        currentTimeBin=Mon1;
                    }else if(zoomScale<d3_time_zoomScaleSteps[2]){
                        currentTimeBin=D15;
                    }else if(zoomScale<d3_time_zoomScaleSteps[3]){
                        currentTimeBin=D10;
                    }else if(zoomScale<d3_time_zoomScaleSteps[4]){
                        currentTimeBin=D4;
                    }else if(zoomScale<d3_time_zoomScaleSteps[5]){
                        currentTimeBin=D1;
                    }else if(zoomScale<d3_time_zoomScaleSteps[6]){
                        currentTimeBin=H12;
                    }else if(zoomScale<d3_time_zoomScaleSteps[7]){
                        currentTimeBin=H6;
                    }else if(zoomScale<d3_time_zoomScaleSteps[8]){
                        currentTimeBin=H1;
                    }else if(zoomScale<d3_time_zoomScaleSteps[9]){
                        currentTimeBin=M30;
                    }else if(zoomScale<d3_time_zoomScaleSteps[10]){
                        currentTimeBin=M10;
                    }else if(zoomScale<d3_time_zoomScaleSteps[11]){
                        currentTimeBin=M5;
                    }else if(zoomScale<d3_time_zoomScaleSteps[12]){
                        currentTimeBin=M1;
                    }else if(zoomScale<d3_time_zoomScaleSteps[13]){
                        currentTimeBin=S30;
                    }else if(zoomScale<d3_time_zoomScaleSteps[14]){
                        currentTimeBin=S10;
                    }else if(zoomScale<d3_time_zoomScaleSteps[15]){
                        currentTimeBin=S5;
                    }else if(zoomScale>d3_time_zoomScaleSteps[16]){
                        currentTimeBin=S1;
                    }
                    timeBin=d3_time_bin.get(currentTimeBin);
                    // apply x_axis
                    gXAxis.call(xAxis.scale(d3.event.transform.rescaleX(xScale)));
                    // apply sp Tick Size
                    _customizedTickSize();
                    // refresh barWidth
                    _calculateCurrentBarWidth(timeBin);
                    // refresh timeBinSize
                    _refreshCurrentTimeBinSize(currentTimeBin);
                    //refresh timeFormat
                    currentTimeFormat=timeBin[5][0];
                    //refresh sliderposition
                    _refreshSliderPosition();
                    //refresh xAxisExtent
                    _refreshAxisExtentContent();
                    //refresh hoverline
                    _refreshHoverLinePosition(buttonFlag,mouseX);

                    function _refreshSliderPosition(){
                        var position_y_start=height-sliderMin_center_to_bottom-2*sliderCircle_radius-sliderTarget_margin;
                        var position_y_end=sliderMax_center_to_top+2*sliderCircle_radius+sliderTarget_margin;
                        var averageStep=(position_y_start-position_y_end)%17;
                        switch (currentTimeBin){
                            case Mon3:
                                currentSlider_yPostion=position_y_start;
                                break;
                            case Mon1:
                                currentSlider_yPostion=position_y_start-averageStep;
                                break;
                            case D15:
                                currentSlider_yPostion=position_y_start-2*averageStep;
                                break;
                            case D10:
                                currentSlider_yPostion=position_y_start-3*averageStep;
                                break;
                            case D4:
                                currentSlider_yPostion=position_y_start-4*averageStep;
                                break;
                            case D1:
                                currentSlider_yPostion=position_y_start-5*averageStep;
                                break;
                            case H12:
                                currentSlider_yPostion=position_y_start-6*averageStep;
                                break;
                            case H6:
                                currentSlider_yPostion=position_y_start-7*averageStep;
                                break;
                            case H1:
                                currentSlider_yPostion=position_y_start-8*averageStep;
                                break;
                            case M30:
                                currentSlider_yPostion=position_y_start-9*averageStep;
                                break;
                            case M10:
                                currentSlider_yPostion=position_y_start-10*averageStep;
                                break;
                            case M5:
                                currentSlider_yPostion=position_y_start-11*averageStep;
                                break;
                            case M1:
                                currentSlider_yPostion=position_y_start-12*averageStep;
                                break;
                            case S30:
                                currentSlider_yPostion=position_y_start-13*averageStep;
                                break;
                            case S10:
                                currentSlider_yPostion=position_y_start-14*averageStep;
                                break;
                            case S5:
                                currentSlider_yPostion=position_y_start-15*averageStep;
                                break;
                            case S2:
                                currentSlider_yPostion=position_y_start-16*averageStep;
                                break;
                            case S1:
                                currentSlider_yPostion=position_y_end;
                                break;
                        }
                        gZoomSlide_target.select('circle').attr('cy',currentSlider_yPostion);
                        gZoomSlide_target.select('line').attr('y1',currentSlider_yPostion+5).attr('y2',currentSlider_yPostion+9);
                        gZoomSlide_target.select('.slider-triangle-up').attr('d',function(){
                            var leftX=width-19-4;
                            var leftY=currentSlider_yPostion;
                            var topX=width-19;
                            var topY=currentSlider_yPostion-6;
                            var rightX=width-19+4;
                            var rightY=currentSlider_yPostion;
                            return 'M ' + leftX +' '+ leftY + ' L '+topX+' '+topY+' L '+rightX+' '+rightY +' z';
                        });
                        gZoomSlide_target.select('.slider-triangle-down').attr('d',function(){
                            var leftX=width-19-4;
                            var leftY=currentSlider_yPostion;
                            var bottomX=width-19;
                            var bottomY=currentSlider_yPostion+6;
                            var rightX=width-19+4;
                            var rightY=currentSlider_yPostion;
                            return 'M ' + leftX +' '+ leftY + ' L '+bottomX+' '+bottomY+' L '+rightX+' '+rightY +' z';
                        });
                    }

                    function _refreshAxisExtentContent(){
                        axisExtentText.text(function(){
                            return 'Showing '+currentTimeFormat(xAxis.scale().domain()[0])+' through '+currentTimeFormat(xAxis.scale().domain()[1]);
                        });
                    }

                    function _refreshCurrentTimeBinSize(){
                        binSizeText.text(function(){
                            return 'Bin size: '+d3_time_bin.get(currentTimeBin)[2];
                        })
                    }

                    // tickSize
                    function _customizedTickSize(){
                        gXAxis.selectAll(".tick line").filter(function(d){
                            var flag;
                            switch (currentTimeBin){
                                case Mon3:
                                    flag=false;
                                    break;
                                case Mon1:
                                case D15:
                                case D10:
                                case D4:
                                    flag= d.getMonth()===0;
                                    break;
                                case D1:
                                case H12:
                                case H6:
                                    flag= d.getDate()===1;
                                    break;
                                case H1:
                                case M30:
                                case M10:
                                case M5:
                                    flag=d.getHours()===0;
                                    break;
                                case M1:
                                case S30:
                                case S10:
                                case S5:
                                case S2:
                                    flag=d.getMinutes()===0;
                                    break;
                                case S1:
                                    flag=d.getSeconds()===0;
                                    break;
                            }
                            return flag;
                        }).attr('y2',9);
                    }
                }
                // zoom.scaleTo(svg,1);
            });
        }
        var isInt=function(n){return Number(n) === n && n % 1 === 0;};
        var showTimelineLoading=function(){gLoading_circle.style('visibility','visible');};
        var hideTimelineLoading=function(){gLoading_circle.style('visibility','hidden');};
        var refreshYaxis=function(yScale){
            gYAxis.call(_make_y_axis(yScale));
            hideTimelineLoading();
            function _make_y_axis(yScale){
                return d3.axisLeft(yScale)
                    .ticks(6)
                    .tickSize(0)
                    .tickFormat(function (d) {
                        if(d&&isInt(d)) return d;
                    });
            }
        };

        var refreshBarChart=function(data){
            var mayContainsHackBarWidth=false;
            switch(currentTimeBin){
                case Mon3:
                case D15:
                case D10:
                case D4:
                    mayContainsHackBarWidth=true;
                    break;
            }
            var yScale=d3.scaleLinear()
                .domain([0,currentYaxisMaxValue])
                .range([height, 0]);
            //refresh grid before barChart
            gGrid.call(_make_y_axis_grid(yScale));
            var rects =groups.selectAll("rect");
            var update = rects.data(data[0]);
            var enter = update.enter();
            var exit = update.exit();
            update.attr("x", function (d) {
                return xAxis.scale()(d.Date);
            })
                .attr("y", function (d) {
                    return -(-yScale(d.y0)- yScale(d.y) + height * 2);
                })
                .attr("height", function (d) {
                    return -yScale(d.y) + height;
                })
                .attr("width",function(d){
                    return _generateBarWidthForDayTimeBin(d.Date,mayContainsHackBarWidth);
                })
                .style("fill-opacity", 1);

            enter.append('rect')
                .attr("x", function (d) {
                    return xAxis.scale()(d.Date);
                })
                .attr("y", function (d) {
                    return -(-yScale(d.y0)- yScale(d.y) + height * 2);
                })
                .attr("height", function (d) {
                    return -yScale(d.y) + height;
                })
                .attr("width",function(d){
                    return _generateBarWidthForDayTimeBin(d.Date,mayContainsHackBarWidth);
                })
                .style("fill-opacity", 1);

            exit.remove();
            return yScale;

            function _generateBarWidthForDayTimeBin(date,possibility){
                if(!possibility) return currentBarWidth;
                var months_Day31=[0,2,4,6,7,9,11];
                var months_Day30=[3,5,8,10];
                var year=date.getFullYear();
                var leapFlag=_checkIfLeapYear(year);
                var month=date.getMonth();
                var day=date.getDate();
                if(currentTimeBin==Mon3){
                    if(month==0||month==3||month==6||month==9){
                        return xAxis.scale()(new Date(year,month+3))-xAxis.scale()(date)
                    }else {
                        return currentBarWidth;
                    }
                }
                if(month===1){
                    if(day===16&&currentTimeBin==D15){
                        if(leapFlag) return hackBarWidth.feb_29.day_15.start_16;
                        return hackBarWidth.feb_28.day_15.start_16;
                    }
                    if(day===21&&currentTimeBin==D10){
                        if(leapFlag) return hackBarWidth.feb_29.day_10.start_21;
                        return hackBarWidth.feb_28.day_10.start_21;
                    }
                    if(day===25&&currentTimeBin==D4&&leapFlag) return hackBarWidth.feb_29.day_4.start_25;
                }

                if(months_Day30.indexOf(month)!==-1){
                    if(day===25&&currentTimeBin===D4) return hackBarWidth.month_30.day_4.start_25
                }

                if(months_Day31.indexOf(month)!==-1){
                    if(day===16&&currentTimeBin===D15) return hackBarWidth.month_31.day_15.start_16;
                    if(day===21&&currentTimeBin===D10) return hackBarWidth.month_31.day_10.start_21;
                    if(day===25&&currentTimeBin===D4) return hackBarWidth.month_31.day_4.start_25;
                }
                return currentBarWidth;
                function _checkIfLeapYear(year){
                    return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0);
                }
            }

            function _make_y_axis_grid(yScale) {
                return　d3.axisLeft(yScale)
                    .ticks(6)
                    .tickSize(-width,0)
                    .tickFormat("");
            }
        };

        var handleData=function(data){
            dataSet = ["objectType"].map(function () {
                return data.map(function (d) {
                    return {
                        Date : new Date(d.date),
                        y : d.count,
                        y0:0
                    };
                });
            });
            currentYaxisMaxValue=d3.max(dataSet, function (d) {
                return d3.max(d, function (d) {
                    return d.y0+d.y;
                });
            });
        };

        exports.refreshYaxis=refreshYaxis;
        exports.refreshBarChart=refreshBarChart;
        exports.handleData=handleData;

        exports.domainAndBinsize=function(min,max){
            if (!arguments.length) return {domain:[+minDate,+maxDate],binSize:currentTimeBin};
            //set the domain for xAxis
            var domain=_calculateDomainExtent(min,max);
            minDate=domain.minDate;
            maxDate=domain.maxDate;
            //set the current time bin
            currentTimeBin=Mon3;
            return this;

            function _calculateDomainExtent(min,max){
                var dataMinDate=new Date(min);
                var dataMaxDate=new Date(max);
                var dataMinYear=dataMinDate.getFullYear();
                var dataMaxYear=dataMaxDate.getFullYear();
                var diff=dataMaxYear-dataMinYear;
                var minDate,maxDate;
                switch (diff){
                    case 0:
                        minDate=new Date(dataMinYear-3,0);
                        maxDate=new Date(dataMaxYear+6,0);
                        break;
                    case 1:
                        minDate=new Date(dataMinYear-3,0);
                        maxDate=new Date(dataMaxYear+5,0);
                        break;
                    case 2:
                        minDate=new Date(dataMinYear-3,0);
                        maxDate=new Date(dataMaxYear+4,0);
                        break;
                    case 3:
                        minDate=new Date(dataMinYear-2,0);
                        maxDate=new Date(dataMaxYear+4,0);
                        break;
                    case 4:
                        minDate=new Date(dataMinYear-2,0);
                        maxDate=new Date(dataMaxYear+3,0);
                        break;
                    case 5:
                        minDate=new Date(dataMinYear-2,0);
                        maxDate=new Date(dataMaxYear+2,0);
                        break;
                    case 6:
                        minDate=new Date(dataMinYear-1,0);
                        maxDate=new Date(dataMaxYear+2,0);
                        break;
                    case 7:
                        minDate=new Date(dataMinYear-1,0);
                        maxDate=new Date(dataMaxYear+1,0);
                        break;
                    case 8:
                        minDate=new Date(dataMinYear-1,0);
                        maxDate=new Date(dataMaxYear+1,0);
                        break;
                    default:
                        minDate=new Date(dataMinYear-1,0);
                        maxDate=new Date(dataMinYear+8,0);
                        break;
                }
                return {
                    minDate:minDate,
                    maxDate:maxDate
                };
            }
        };

        exports.refreshTimeline=function(_){
            this.handleData(_);
            this.refreshYaxis(this.refreshBarChart(dataSet));
            return this;
        };

        exports.width = function(_x) {
            if (!arguments.length) return width;
            width = parseInt(_x)-margin.left-margin.right;
            return this;
        };
        exports.height = function(_x) {
            if (!arguments.length) return height;
            height = parseInt(_x)-margin.top-margin.bottom;
            return this;
        };
        exports.on=function(){
            var value=dispatch.on.apply(dispatch,arguments);
            return value==dispatch?exports:value;
        };
        return exports;
    };
}(window.d3);
